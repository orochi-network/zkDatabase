import { getCurrentTime, transactionQueue } from '@helper';
import { ModelUser } from '@model';
import { FixedFloat } from '@orochi-network/utilities';
import {
  ETransactionStatus,
  ETransactionType,
  TDbRecord,
  TTransaction,
} from '@zkdb/common';
import { MinaNetwork } from '@zkdb/smart-contract';
import { ModelMetadataDatabase, ModelTransaction } from '@zkdb/storage';
import { ClientSession, ObjectId, WithId } from 'mongodb';
import { PublicKey } from 'o1js';
import { Database } from './database';

export class Transaction {
  static readonly MINA_DECIMAL = FixedFloat.from({
    basedValue: 10n,
    decimals: 9,
  });

  static readonly MAP_MINIMAL_BALANCE = new Map<ETransactionType, FixedFloat>([
    [ETransactionType.Deploy, Transaction.MINA_DECIMAL.mul(1.1)],
    [ETransactionType.Rollup, Transaction.MINA_DECIMAL.mul(0.1)],
  ]);

  static async enqueue(
    databaseName: string,
    actor: string,
    transactionType: ETransactionType,
    session: ClientSession
  ): Promise<ObjectId> {
    await Database.ownershipCheck(databaseName, actor, session);
    // Check if smart contract is already bound to database
    if (transactionType === ETransactionType.Deploy) {
      const database = await ModelMetadataDatabase.getInstance().findOne(
        { databaseName },
        { session }
      );

      if (
        typeof database?.appPublicKey === 'string' &&
        !PublicKey.fromBase58(database?.appPublicKey).isEmpty()
      ) {
        throw Error('Smart contract is already bound to database');
      }
    }

    const imTransaction = ModelTransaction.getInstance();

    const txList = await imTransaction
      .find(
        { databaseName, transactionType },
        {
          session,
        }
      )
      .toArray();

    // Validate transactions
    if (txList.length > 0) {
      // This case database already deployed on chain before
      if (
        transactionType === ETransactionType.Deploy &&
        txList.some((tx) => tx.status === ETransactionStatus.Confirmed)
      ) {
        // @QUESTION: Do we need to update status of Transaction and also
        // deployment status of database?
        throw new Error('You deploy transaction is already confirmed');
      }

      if (
        // If we have uncompleted transaction, we should not allow to deploy new one.
        // Un-completed transaction is mean that transaction is unsigned or signed without broadcast.
        txList.some(
          (tx) =>
            tx.status === ETransactionStatus.Unsigned ||
            tx.status === ETransactionStatus.Signed
        )
      ) {
        throw Error('You have uncompleted transaction');
      }

      const pendingTx = txList.find(
        (tx: WithId<TTransaction>) =>
          tx.status === ETransactionStatus.Confirming
      );

      if (pendingTx) {
        if (pendingTx.txHash) {
          // @TODO: Transaction status check need to be done in cronjob or task schedule
          const onchainTx =
            await MinaNetwork.getInstance().getZkAppTransactionByTxHash(
              pendingTx.txHash
            );

          if (!onchainTx) {
            throw Error('Onchain transaction has not been found');
          }

          if (onchainTx.txStatus === 'applied') {
            await imTransaction.updateOne(
              { _id: pendingTx._id },
              {
                status: ETransactionStatus.Confirmed,
              },
              { session }
            );
            throw Error('You deploy transaction is already succeeded');
          } else if (onchainTx.txStatus === 'failed') {
            await imTransaction.updateOne(
              { _id: pendingTx._id },
              {
                status: ETransactionStatus.Failed,
                error: onchainTx.failures.join(' '),
              },
              { session }
            );
            // Proceed and create new transaction
          }
        } else {
          throw Error('Transaction hash has not been found');
        }
      }

      // @TODO: Recheck the logic and make sure it is correct and cover all cases.
    }

    const payer = await new ModelUser().findOne(
      { userName: actor },
      { session }
    );

    if (!payer || PublicKey.fromBase58(payer?.publicKey).isEmpty()) {
      throw new Error('User public key not found');
    }

    const insertResult = await imTransaction.insertOne(
      // @TODO: Make sure to check falsy don't just check typeof undefined or null.
      // Since we using default value
      // @TODO: Need refactor or allow nullable to insert empty transaction
      {
        transactionType,
        databaseName,
        status: ETransactionStatus.Unsigned,
        transactionRaw: '',
        txHash: '',
        error: '',
        createdAt: getCurrentTime(),
        updatedAt: getCurrentTime(),
      },
      { session }
    );
    // Make sure it commit transaction now before push to the queue
    await session.commitTransaction();

    await transactionQueue.add('transaction', {
      transactionObjectId: insertResult.insertedId,
      payerAddress: payer?.publicKey,
    });

    return insertResult.insertedId;
  }

  static async draft(
    databaseName: string,
    actor: string,
    transactionType: ETransactionType,
    session?: ClientSession
  ): Promise<TDbRecord<TTransaction>> {
    await Database.ownershipCheck(databaseName, actor, session);

    const imUser = new ModelUser();
    const user = await imUser.findOne({ userName: actor }, { session });

    if (!user) {
      throw Error(`User ${actor} does not exist`);
    }

    const database = await ModelMetadataDatabase.getInstance().findOne({
      databaseName,
    });

    if (!database) {
      throw Error(`Database ${databaseName} does not exist`);
    }

    const transactionList = await ModelTransaction.getInstance()
      .find({ databaseName, transactionType }, { session })
      .toArray();

    const unsignedTransaction = transactionList.find(
      (tx) => tx.status === ETransactionStatus.Unsigned
    );

    if (unsignedTransaction) {
      const { account, error } = await MinaNetwork.getInstance().getAccount(
        PublicKey.fromBase58(user.publicKey)
      );

      if (error) {
        throw Error(`${error.statusCode}: ${error.statusText}`);
      }

      if (account) {
        const balance = FixedFloat.from({
          basedValue: account.balance.toBigInt(),
          decimals: 9,
        });

        const minBalance =
          Transaction.MAP_MINIMAL_BALANCE.get(transactionType)!;

        if (balance.lt(minBalance)) {
          throw new Error(
            `Your account need at least ${minBalance} balance unit for ${transactionType}`
          );
        }

        return unsignedTransaction;
      } else {
        throw Error('Account has not been found in Mina Network');
      }
    }

    throw new Error('There is not any unsigned transaction');
  }

  static async latest(databaseName: string, transactionType: ETransactionType) {
    const modelTransaction = ModelTransaction.getInstance();

    const txList = await modelTransaction
      .find({ databaseName, transactionType })
      .limit(1)
      .sort({ createdAt: -1 })
      .toArray();

    return txList.length === 1 ? txList[0] : null;
  }

  static async confirm(
    databaseName: string,
    actor: string,
    transactionObjectId: string,
    txHash: string,
    session?: ClientSession
  ) {
    await Database.ownershipCheck(databaseName, actor, session);

    await ModelTransaction.getInstance().updateOne(
      { _id: new ObjectId(transactionObjectId) },
      {
        txHash,
        status: ETransactionStatus.Confirming,
      },
      { session }
    );
    return true;
  }
}

export default Transaction;

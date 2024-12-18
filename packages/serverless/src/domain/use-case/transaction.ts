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
import { getCurrentTime, transactionQueue } from '@helper';
import { ModelUser } from '@model';
import { Database } from './database';

export class Transaction {
  static readonly MINA_DECIMAL = 1e9;

  static readonly MAP_MINIMAL_BALANCE = new Map<ETransactionType, number>([
    [ETransactionType.Deploy, Transaction.MINA_DECIMAL * 1.1],
    [ETransactionType.Rollup, Transaction.MINA_DECIMAL * 0.1],
  ]);

  static async enqueue(
    databaseName: string,
    actor: string,
    transactionType: ETransactionType,
    session: ClientSession
  ): Promise<ObjectId> {
    if (
      !(await Database.isOwner({ databaseName, databaseOwner: actor }, session))
    ) {
      throw Error('Only database owner can roll up the transaction');
    }

    // Check if smart contract is already bound to database
    if (transactionType === ETransactionType.Deploy) {
      const database = await ModelMetadataDatabase.getInstance().findOne(
        { databaseName },
        { session }
      );

      // Make sure public is set and have value
      if (database?.appPublicKey) {
        throw Error('Smart contract is already bound to database');
      }
    }

    const imTransaction = ModelTransaction.getInstance();

    const txList = await imTransaction.list(databaseName, transactionType, {
      session,
    });

    // Validate transactions
    if (txList.length > 0) {
      // This case database already deployed on chain before
      if (
        transactionType === ETransactionType.Deploy &&
        txList.some(
          (tx: WithId<TTransaction>) =>
            tx.status === ETransactionStatus.Confirmed
        )
      ) {
        // @QUESTION: Do we need to update status of Transaction and also
        // deployment status of database?
        throw new Error('You deploy transaction is already confirmed');
      }

      if (
        // If we have uncompleted transaction, we should not allow to deploy new one.
        // Un-completed transaction is mean that transaction is unsigned or signed without broadcast.
        txList.some(
          (tx: WithId<TTransaction>) =>
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
    transactionType: ETransactionType
  ): Promise<TDbRecord<TTransaction>> {
    const imUser = new ModelUser();

    const user = await imUser.findOne({ userName: actor });

    if (!user) {
      throw Error(`User ${actor} does not exist`);
    }

    if (await Database.isOwner({ databaseName, databaseOwner: actor })) {
      const database = await ModelMetadataDatabase.getInstance().findOne({
        databaseName,
      });

      if (!database) {
        throw Error(`Database ${databaseName} does not exist`);
      }

      const transactionList = await ModelTransaction.getInstance().list(
        databaseName,
        transactionType
      );

      const readyTransaction = transactionList.find(
        (tx) => tx.status === ETransactionStatus.Unsigned
      );

      if (readyTransaction) {
        const { account, error } = await MinaNetwork.getInstance().getAccount(
          PublicKey.fromBase58(user.publicKey)
        );

        if (error) {
          throw Error(`${error.statusCode}: ${error.statusText}`);
        }

        if (account) {
          const balance = account.balance.toBigInt();

          const minBalance = BigInt(
            Transaction.MAP_MINIMAL_BALANCE.get(transactionType)!
          );

          if (balance < minBalance) {
            throw new Error(
              `Your account need at least ${minBalance} balance unit for ${transactionType}`
            );
          }

          return readyTransaction;
        } else {
          throw Error('Account has not been found in Mina Network');
        }
      }

      throw new Error('There is not any unsigned transaction');
    }

    throw new Error('Only database owner can deploy database');
  }

  static async latest(databaseName: string, transactionType: ETransactionType) {
    const modelTransaction = ModelTransaction.getInstance();

    const txList = await modelTransaction.list(databaseName, transactionType, {
      sort: {
        createdAt: -1,
      },
    });

    return txList.length === 0 ? null : txList[0];
  }

  static async confirm(
    databaseName: string,
    actor: string,
    transactionObjectId: string,
    txHash: string
  ) {
    if (!(await Database.isOwner({ databaseName, databaseOwner: actor }))) {
      throw Error('Only database owner can confirm transactions');
    }
    await ModelTransaction.getInstance().updateOne(
      { _id: new ObjectId(transactionObjectId) },
      {
        txHash,
        status: ETransactionStatus.Confirming,
      }
    );
    return true;
  }
}

export default Transaction;

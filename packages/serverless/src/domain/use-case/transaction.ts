import { transactionQueue } from '@helper';
import { ModelUser } from '@model';
import { FixedFloat } from '@orochi-network/utilities';
import {
  ETransactionStatus,
  ETransactionType,
  TTransactionRecord,
} from '@zkdb/common';
import { MinaNetwork } from '@zkdb/smart-contract';
import { ModelMetadataDatabase, ModelTransaction } from '@zkdb/storage';
import { ClientSession, ObjectId } from 'mongodb';
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
        database?.appPublicKey &&
        !PublicKey.fromBase58(database?.appPublicKey).isEmpty().toBoolean()
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

      // @TODO: Recheck the logic and make sure it is correct and cover all cases.
    }

    const payer = await new ModelUser().findOne(
      { userName: actor },
      { session }
    );

    if (
      !payer ||
      PublicKey.fromBase58(payer?.publicKey).isEmpty().toBoolean()
    ) {
      throw new Error('User public key not found');
    }
    await session.commitTransaction();
    /*
    NOTE: we will get an race-condition bug if we insert transaction here,
    First, if we insertOne transaction here, it actually not inserted since it in 'mongodb session'
    It still return objectId but not insert to mongo yet
    If we you session.commitTransaction(), we still get race-condition
    The queue will run first and update transactionRaw before the insert does
    So it will override the transaction and we got nothing
    */
    /*
      My current solution is let the compile service create transaction
      We will create objectId for it first 
    */
    const transactionObjectId = new ObjectId();

    await transactionQueue.add('transaction', {
      transactionObjectId,
      payerAddress: payer?.publicKey,
      databaseName,
      transactionType,
    });

    return transactionObjectId;
  }

  static async draft(
    databaseName: string,
    actor: string,
    transactionType: ETransactionType,
    session?: ClientSession
  ): Promise<TTransactionRecord> {
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
    const imTransaction = ModelTransaction.getInstance();

    const txList = await imTransaction
      .find({ databaseName, transactionType })
      .limit(1)
      .sort({ createdAt: -1 })
      .toArray();

    return txList.length === 1 ? txList[0] : null;
  }

  static async submit(
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
        $set: {
          txHash,
          status: ETransactionStatus.Signed,
        },
      },
      { session }
    );
    return true;
  }
}

export default Transaction;

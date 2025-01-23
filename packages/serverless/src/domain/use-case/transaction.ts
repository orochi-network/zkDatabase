/* eslint-disable import/no-cycle */
import { transactionQueue } from '@helper';
import { ModelUser } from '@model';
import { FixedFloat } from '@orochi-network/utilities';
import {
  ETransactionStatus,
  ETransactionType,
  TTransactionDraftResponse,
} from '@zkdb/common';
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
        throw new Error('Smart contract is already bound to database');
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
        throw new Error('You have uncompleted transaction');
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

    const transactionObjectId = new ObjectId();
    // We need to create transactionObjectId here
    // If we create transactionObjectId here, it still stay on the session mongodb and not created yet on database
    // So when the worker service can't find
    // So we created a objectId first and let the worker queue create transaction
    // If you try commit before `await transactionQueue.add()` to force mongodb created on database
    // You can't be able to use any session after this Transaction.enqueue anymore, because the session already commit
    // TODO: Will refactor in the future. Drop bullMQ, using our GenericQueue<T>
    await transactionQueue.add(
      'transaction',
      {
        transactionObjectId,
        payerAddress: payer?.publicKey,
        databaseName,
        transactionType,
      },
      {
        deduplication: {
          id: `${databaseName}-${transactionType}`,
        },
      }
    );

    return transactionObjectId;
  }

  static async draft(
    databaseName: string,
    actor: string,
    transactionType: ETransactionType,
    session: ClientSession
  ): Promise<TTransactionDraftResponse> {
    await Database.ownershipCheck(databaseName, actor, session);

    const imUser = new ModelUser();
    const user = await imUser.findOne({ userName: actor }, { session });

    if (!user) {
      throw new Error(`User ${actor} does not exist`);
    }

    const database = await ModelMetadataDatabase.getInstance().findOne(
      {
        databaseName,
      },
      { session }
    );

    if (!database) {
      throw new Error(`Database ${databaseName} does not exist`);
    }
    /*
      Contract already deploy -> Throw error
      Contract not deploy yet, no data -> add to queue, return null (make sure queue not deduplicated)
      Contract not deploy yet, have data -> return data
    */
    const imTransaction = ModelTransaction.getInstance();
    if (transactionType === ETransactionType.Deploy) {
      const transactionDeploy = await imTransaction.findOne(
        {
          databaseName,
          transactionType: ETransactionType.Deploy,
        },
        { session }
      );

      // Contract already deploy, throw error
      if (database.appPublicKey) {
        throw new Error(
          `Transaction already deployed database ${databaseName}`
        );
      }

      // Contract not deploy yet, no data -> add to queue, return null (make sure queue not deduplicated)
      if (!transactionDeploy) {
        await Transaction.enqueue(
          databaseName,
          actor,
          ETransactionType.Deploy,
          session
        );
        return null;
      }

      return (
        transactionDeploy && {
          ...transactionDeploy,
          rawTransactionId: transactionDeploy._id,
        }
      );
    }
    if (transactionType === ETransactionType.Rollup) {
      const transactionRollup = await imTransaction.findOne(
        {
          databaseName,
          transactionType: ETransactionType.Rollup,
          status: ETransactionStatus.Unsigned,
        },
        { session, sort: { createdAt: -1 } }
      );

      return (
        transactionRollup && {
          ...transactionRollup,
          rawTransactionId: transactionRollup._id,
        }
      );
    }
    throw new Error(`Unsupported transaction type ${transactionType}`);
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
    rawTransactionId: string,
    txHash: string,
    session?: ClientSession
  ) {
    await Database.ownershipCheck(databaseName, actor, session);

    await ModelTransaction.getInstance().updateOne(
      { _id: new ObjectId(rawTransactionId) },
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

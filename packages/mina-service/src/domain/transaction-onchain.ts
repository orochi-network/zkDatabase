import { ETransactionStatus, TZkAppTransaction } from '@zkdb/common';
import { ModelMetadataDatabase, ModelTransaction } from '@zkdb/storage';
import { ClientSession, ObjectId } from 'mongodb';

export class TransactionOnChain {
  public static async rollup(
    transactionObjectId: ObjectId,
    zkTransaction: TZkAppTransaction | undefined,
    session: ClientSession
  ): Promise<boolean> {
    const imTransaction = ModelTransaction.getInstance();

    if (!zkTransaction) {
      const updatedTransaction = await imTransaction.collection.updateOne(
        {
          _id: transactionObjectId,
          status: {
            // We skip the confirming
            // Sometime the rpc Mina chain won't stable that throw 404
            // That lead to confirming status back to unconfirmed
            $nin: [ETransactionStatus.Confirming],
          },
        },
        {
          $set: {
            status: ETransactionStatus.Unconfirmed,
          },
        },
        { session }
      );

      return updatedTransaction.acknowledged;
    }
    // zkTransaction from mina got error
    if (
      zkTransaction.failures?.length > 0 ||
      zkTransaction.txStatus === 'failed'
    ) {
      const transactionUpdated = await imTransaction.updateOne(
        { _id: transactionObjectId },
        {
          $set: {
            status: ETransactionStatus.Failed,
            error: zkTransaction.failures.join(' '),
          },
        },
        { session }
      );
      return transactionUpdated.acknowledged;
    }

    if (zkTransaction.txStatus === 'pending') {
      const updatedTransaction = await imTransaction.collection.updateOne(
        { _id: transactionObjectId },
        {
          $set: {
            status: ETransactionStatus.Confirming,
          },
        },
        { session }
      );
      return updatedTransaction.acknowledged;
    }

    if (zkTransaction.txStatus === 'applied') {
      const updatedTransaction = await imTransaction.collection.updateOne(
        {
          _id: transactionObjectId,
        },
        {
          $set: {
            status: ETransactionStatus.Confirmed,
          },
        },
        {
          session,
        }
      );

      return updatedTransaction.acknowledged;
    }

    throw new Error(
      `Unknown on-chain rollup transaction status, objectId ${transactionObjectId}, zkTransaction ${zkTransaction}`
    );
  }

  public static async deploy(
    transactionObjectId: ObjectId,
    zkTransaction: TZkAppTransaction | undefined,
    session: ClientSession
  ): Promise<boolean> {
    const imTransaction = ModelTransaction.getInstance();
    const imMetadataDatabase = ModelMetadataDatabase.getInstance();

    if (!zkTransaction) {
      // Transaction not found in Mina, which mean unconfirmed
      const updatedTransaction =
        await imTransaction.collection.findOneAndUpdate(
          {
            _id: transactionObjectId,
            status: {
              // We skip the confirming
              // Sometime the rpc Mina chain won't stable that throw 404
              // That lead to confirming status back to unconfirmed
              $nin: [ETransactionStatus.Confirming],
            },
          },
          {
            $set: {
              status: ETransactionStatus.Unconfirmed,
            },
          },
          { session }
        );

      if (!updatedTransaction) {
        return false;
      }

      const metadataDatabaseUpdated = await imMetadataDatabase.updateOne(
        {
          databaseName: updatedTransaction.databaseName,
        },
        {
          $set: {
            deployStatus: ETransactionStatus.Unconfirmed,
          },
        },
        {
          session,
        }
      );

      return metadataDatabaseUpdated.acknowledged;
    }
    // zkTransaction from mina got error
    if (
      zkTransaction.failures?.length > 0 ||
      zkTransaction.txStatus === 'failed'
    ) {
      const updatedTransaction =
        await imTransaction.collection.findOneAndUpdate(
          { _id: transactionObjectId },
          {
            $set: {
              status: ETransactionStatus.Failed,
              error: zkTransaction.failures.join(' '),
            },
          },
          { session }
        );

      const updateMetadataDatabase = await imMetadataDatabase.updateOne(
        {
          databaseName: updatedTransaction?.databaseName,
        },
        {
          $set: {
            deployStatus: ETransactionStatus.Failed,
          },
        },
        { session }
      );

      return updateMetadataDatabase.acknowledged;
    }

    if (zkTransaction.txStatus === 'pending') {
      const updatedTransaction =
        await imTransaction.collection.findOneAndUpdate(
          { _id: transactionObjectId },
          {
            $set: {
              status: ETransactionStatus.Confirming,
            },
          },
          { session }
        );

      const updateMetadataDatabase = await imMetadataDatabase.updateOne(
        {
          databaseName: updatedTransaction?.databaseName,
        },
        {
          $set: {
            deployStatus: ETransactionStatus.Confirming,
          },
        },
        { session }
      );

      return updateMetadataDatabase.acknowledged;
    }

    if (zkTransaction.txStatus === 'applied') {
      const updatedTransaction =
        await imTransaction.collection.findOneAndUpdate(
          { _id: transactionObjectId },
          {
            $set: {
              status: ETransactionStatus.Confirmed,
            },
          },
          { session }
        );

      const updateMetadataDatabase = await imMetadataDatabase.updateOne(
        {
          databaseName: updatedTransaction?.databaseName,
        },
        {
          $set: {
            deployStatus: ETransactionStatus.Confirmed,
          },
        },
        { session }
      );

      return updateMetadataDatabase.acknowledged;
    }

    throw new Error(
      `Unknown on-chain deploy transaction status, objectId ${transactionObjectId}, zkTransaction ${zkTransaction}`
    );
  }
}

export default TransactionOnChain;

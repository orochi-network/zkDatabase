import { ETransactionStatus, TZkAppTransaction } from '@zkdb/common';
import { ZkDbProcessor } from '@zkdb/smart-contract';
import {
  ModelMetadataDatabase,
  ModelRollupOnChainHistory,
  ModelTransaction,
} from '@zkdb/storage';
import { ClientSession, ObjectId } from 'mongodb';
import { PublicKey } from 'o1js';

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
      await imTransaction.updateOne(
        { _id: transactionObjectId },
        {
          $set: {
            status: ETransactionStatus.Failed,
            error: zkTransaction.failures.join(' '),
          },
        },
        { session }
      );
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
      const updatedTransaction =
        await imTransaction.collection.findOneAndUpdate(
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

      if (!updatedTransaction) {
        return false;
      }

      // Insert on chain info
      // NOTE: Do get onchain data from smart contract or we get from transaction
      const imMetadataDatabase = ModelMetadataDatabase.getInstance();

      const metadataDatabase = await imMetadataDatabase.findOne(
        { databaseName: updatedTransaction.databaseName },
        { session }
      );

      if (!metadataDatabase) {
        throw new Error(
          `Cannot found metadata database ${updatedTransaction.databaseName}`
        );
      }

      const zkDbProcessor = await ZkDbProcessor.getInstance(
        metadataDatabase.merkleHeight
      );

      const zkDbContract = zkDbProcessor.getInstanceZkDBContract(
        PublicKey.fromBase58(metadataDatabase.appPublicKey)
      );

      const rollupOnChainHistoryUpdateResult =
        await ModelRollupOnChainHistory.getInstance().updateOne(
          {
            databaseName: updatedTransaction.databaseName,
            transactionObjectId,
          },
          {
            $set: {
              step: zkDbContract.step.get().toBigInt(),
              updatedAt: new Date(),
            },
          },
          { session }
        );
      return rollupOnChainHistoryUpdateResult.acknowledged;
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

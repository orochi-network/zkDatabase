import { getCurrentTime, logger } from '@helper';
import {
  ETransactionStatus,
  ETransactionType,
  TRollUpDetail,
} from '@zkdb/common';
import {
  ModelMetadataDatabase,
  ModelProof,
  ModelRollupHistory,
  ModelRollUpState,
  ModelTransaction,
  TCompoundSession,
} from '@zkdb/storage';
import { ClientSession } from 'mongodb';
import { PublicKey } from 'o1js';
import { Database } from './database';
import Transaction from './transaction';

export class Rollup {
  static async create(
    databaseName: string,
    actor: string,
    compoundSession: TCompoundSession
  ): Promise<boolean> {
    await Database.ownershipCheck(
      databaseName,
      actor,
      compoundSession.serverless
    );

    const modelProof = ModelProof.getInstance();
    const latestProofForDb = await modelProof.findOne(
      { databaseName },
      {
        session: compoundSession.proofService,
        sort: {
          createdAt: -1,
        },
      }
    );

    if (!latestProofForDb) {
      throw Error('No proof has been generated yet');
    }

    const imRollup = ModelRollupHistory.getInstance();
    const modelTransaction = ModelTransaction.getInstance();

    const rollUp = await imRollup.findOne(
      {
        proofId: latestProofForDb._id,
      },
      { session: compoundSession.serverless }
    );

    if (rollUp) {
      logger.debug('Identified repeated proof');

      const transaction = await modelTransaction.findOne(
        {
          _id: rollUp.transactionObjectId,
        },
        { session: compoundSession.serverless }
      );

      if (transaction) {
        if (transaction.status === ETransactionStatus.Confirmed) {
          throw Error('You cannot roll-up the same proof');
        }

        if (transaction.status === ETransactionStatus.Unsigned) {
          throw Error(
            'You already have uncompleted transaction with the same proof'
          );
        }
      }
    }

    const transactionObjectId = await Transaction.enqueue(
      databaseName,
      actor,
      ETransactionType.Rollup,
      compoundSession.serverless
    );

    const currentTime = getCurrentTime();
    await imRollup.insertOne(
      {
        databaseName,
        transactionObjectId,
        // @NOTICE Something possible wrong here
        merkleTreeRoot: latestProofForDb.merkleRoot,
        merkleTreeRootPrevious: latestProofForDb.merkleRootPrevious,
        proofObjectId: latestProofForDb._id,
        createdAt: currentTime,
        updatedAt: currentTime,
        error: '',
      },
      { session: compoundSession?.serverless }
    );

    return true;
  }

  static async history(
    databaseName: string,
    session?: ClientSession
  ): Promise<TRollUpDetail | null> {
    const database = await ModelMetadataDatabase.getInstance().findOne(
      { databaseName },
      {
        session,
      }
    );

    if (
      !database?.appPublicKey ||
      PublicKey.fromBase58(database?.appPublicKey).isEmpty().toBoolean()
    ) {
      throw Error('Database is not bound to zk app');
    }

    const imRollupHistory = ModelRollupHistory.getInstance();
    const imRollupState = await ModelRollUpState.getInstance(databaseName);
    const rollupHistory = await imRollupHistory
      .find({ databaseName })
      .sort({ createdAt: -1, updatedAt: -1 })
      .toArray();
    const rollupState = await imRollupState.findOne({ databaseName });
    // state.roll
    if (rollupHistory.length > 0 && rollupState) {
      return {
        ...rollupState,
        history: rollupHistory,
      };
    }

    return null;
  }
}

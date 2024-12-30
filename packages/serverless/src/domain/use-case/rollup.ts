import { getCurrentTime, logger } from '@helper';
import {
  ETransactionStatus,
  ETransactionType,
  TRollUpDetail,
  TRollUpHistoryDetail,
} from '@zkdb/common';
import {
  ModelMetadataDatabase,
  ModelProof,
  ModelRollupHistory,
  ModelTransaction,
  TCompoundSession,
  zkDatabaseConstant,
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
    await Database.ownershipCheck(databaseName, actor);

    const modelProof = ModelProof.getInstance();
    const latestProofForDb = await modelProof.findOne(
      { databaseName },
      {
        session: compoundSession?.proofService,
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

    const rollUp = await imRollup.collection.findOne({
      proofId: latestProofForDb._id,
    });

    if (rollUp) {
      logger.debug('Identified repeated proof');

      const transaction = await modelTransaction.findOne({
        _id: rollUp.transactionObjectId,
      });

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
        // Initialize nullable value for rollup history
        error: null,
        rollUpDifferent: null,
        rollUpState: null,
      },
      { session: compoundSession?.serverless }
    );

    return true;
  }

  static async history(
    databaseName: string,
    session?: ClientSession
  ): Promise<TRollUpDetail | null> {
    const imRollupHistory = ModelRollupHistory.getInstance();

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

    const pipeline = [
      // Step 1: Match documents that have a specific 'databaseName'
      {
        $match: { databaseName },
      },
      // Step 2: Join this 'rollup' with 'transaction' & 'proof' collection
      {
        $lookup: {
          from: zkDatabaseConstant.globalCollection.transaction,
          localField: 'transactionObjectId',
          foreignField: '_id',
          as: 'transaction',
        },
      },
      {
        $lookup: {
          from: zkDatabaseConstant.globalCollection.proof,
          localField: 'proofObjectId',
          foreignField: '_id',
          as: 'proof',
        },
      },
      // Step 3: Sort by latest
      {
        $sort: { updatedAt: -1, createdAt: -1 },
      },
    ];

    const listRollupHistoryDetail = await imRollupHistory.collection
      .aggregate<TRollUpHistoryDetail>(pipeline)
      .toArray();

    const [latestRollup, ..._] = listRollupHistoryDetail;

    if (listRollupHistoryDetail.length > 0) {
      return {
        state: latestRollup.rollUpState,
        rollUpDifferent: latestRollup.rollUpDifferent || 0,
        history: listRollupHistoryDetail,
        latestRollUpSuccess:
          listRollupHistoryDetail
            .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
            .find(
              (rollup) =>
                rollup.transaction.status === ETransactionStatus.Confirmed
            )?.updatedAt || null,
      };
    }

    return null;
  }
}

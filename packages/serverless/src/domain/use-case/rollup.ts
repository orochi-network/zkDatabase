import { logger } from '@helper';
import {
  EMinaTransactionStatus,
  ERollupState,
  ETransactionStatus,
  ETransactionType,
  TRollUpOffChainAndTransitionAggregate,
  TRollupOffChainHistory,
  TRollupOffChainHistoryParam,
  TRollupOffChainHistoryRequest,
  TRollupOffChainHistoryResponse,
  TRollupOffChainQueueTransitionAggregate,
  TRollupOnChainStateResponse,
  TRollupQueueData,
  databaseName,
} from '@zkdb/common';
import {
  ModelMetadataDatabase,
  ModelRollupOnChainHistory,
  ModelRollupOffChain,
  ModelRollupOnChain,
  ModelTransaction,
  TCompoundSession,
  ModelGenericQueue,
  zkDatabaseConstant,
  ModelDatabase,
  DATABASE_ENGINE,
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

    const imRollupOffChain = ModelRollupOffChain.getInstance();
    const [latestProofForDb] = await imRollupOffChain.collection
      .aggregate<TRollUpOffChainAndTransitionAggregate>([
        {
          $match: { databaseName },
        },
        {
          $sort: { createdAt: -1 },
        },
        {
          $limit: 1,
        },
        {
          $lookup: {
            from: zkDatabaseConstant.globalCollection.transaction,
            localField: 'transactionObjectId',
            foreignField: '_id',
            as: 'transaction',
          },
        },
        {
          $unwind: {
            path: '$transaction',
          },
        },
      ])
      .toArray();

    if (!latestProofForDb) {
      throw Error('No proof has been generated yet');
    }

    const imRollupHistory = ModelRollupOnChainHistory.getInstance();
    const imTransaction = ModelTransaction.getInstance();

    const rollUpHistory = await imRollupHistory.findOne(
      {
        proofId: latestProofForDb._id,
      },
      { session: compoundSession.serverless }
    );

    if (rollUpHistory) {
      logger.debug('Identified repeated proof');

      const transaction = await imTransaction.findOne(
        {
          _id: rollUpHistory.transactionObjectId,
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

    const currentTime = new Date();

    await imRollupHistory.insertOne(
      {
        databaseName,
        transactionObjectId,
        // @NOTICE Something possible wrong here
        merkleTreeRoot: latestProofForDb.transition.merkleRootNew,
        merkleTreeRootPrevious: latestProofForDb.merkleRootOld,
        proofObjectId: latestProofForDb._id,
        createdAt: currentTime,
        updatedAt: currentTime,
        step: latestProofForDb.step,
        error: null,
      },
      { session: compoundSession?.serverless }
    );

    return true;
  }

  static async offChainHistory(
    param: TRollupOffChainHistoryParam,
    session: ClientSession
  ): Promise<TRollupOffChainHistoryResponse> {
    //
    const { query, pagination } = param;

    const imRollupOffChainQueue =
      await ModelGenericQueue.getInstance<TRollupQueueData>(
        zkDatabaseConstant.globalCollection.rollupOffChainQueue,
        session
      );

    // Perform aggregation joining 2 collections from 2 databases
    // `rollup_offchain_queue` from db `_zkdatabase_proof_service`
    // with `${databaseName}` from db `_zkdatabase_transition_log`
    const rollupOffChainQueueTransitionAggregateList =
      await imRollupOffChainQueue.collection
        .aggregate<TRollupOffChainQueueTransitionAggregate>([
          {
            $match: {
              databaseName: query.databaseName,
            },
          },
          {
            $lookup: {
              from: `${zkDatabaseConstant.globalTransitionLogDatabase}.${databaseName}`,
              localField: 'transitionObjectId',
              foreignField: '_id',
              as: 'transition',
            },
          },
          {
            $unwind: {
              path: '$transition',
            },
          },
        ])
        .toArray();

    if (!rollupOffChainQueueTransitionAggregateList.length) {
      return {
        data: [],
        total: 0,
        offset: pagination.offset || 0,
      };
    }

    const rollUpOffChainHistory: TRollupOffChainHistory[] =
      rollupOffChainQueueTransitionAggregateList.map((e) => ({
        merkleRootNew: e.data.transition.merkleRootNew,
        merkleRootOld: e.data.transition.merkleRootOld,
        error: e.error,
        docId: e.data.docId,
        status: e.status,
        databaseName: e.databaseName,
        step: BigInt(e.sequenceNumber) + 1n,
      }));

    return {
      data: rollUpOffChainHistory,
      total: rollUpOffChainHistory.length,
      offset: pagination.offset || 0,
    };
  }

  static async onChainHistory(
    param: TRollupHistoryParam,
    session?: ClientSession
  ): Promise<TRollupHistoryResponse> {
    const { query, pagination } = param;

    const metadataDatabase = await ModelMetadataDatabase.getInstance().findOne(
      query,
      {
        session,
      }
    );

    if (
      !metadataDatabase?.appPublicKey ||
      PublicKey.fromBase58(metadataDatabase?.appPublicKey).isEmpty().toBoolean()
    ) {
      throw Error('Database is not bound to zk app');
    }

    const imRollupHistory = ModelRollupOnChainHistory.getInstance();

    const rollupHistory = await imRollupHistory
      .find(query)
      .sort({ createdAt: -1, updatedAt: -1 })
      .toArray();

    if (!rollupHistory.length) {
      return {
        data: [],
        total: 0,
        offset: pagination.offset || 0,
      };
    }

    return {
      data: rollupHistory,
      total: await imRollupHistory.count(query),
      offset: pagination.offset || 0,
    };
  }

  static async state(
    databaseName: string
  ): Promise<TRollupOnChainStateResponse> {
    const imRollupOnChain = ModelRollupOnChain.getInstance();
    const imRollupOnChainHistory = ModelRollupOnChainHistory.getInstance();

    // Get latest rollup history
    const latestRollupHistory = await imRollupOnChainHistory.findOne(
      { databaseName },
      { sort: { updatedAt: -1, createdAt: -1 } }
    );

    // Get onchain rollup info, we don't interact with smart contract in serverless
    const rollupOnChainHistory = await imRollupOnChain
      .find({ databaseName }, { sort: { createdAt: -1 } })
      .toArray();

    const latestOnChainRollup = rollupOnChainHistory.at(0);

    if (!latestRollupHistory || !latestOnChainRollup) {
      return null;
    }

    const rollUpDifferent = latestRollupHistory.step - latestOnChainRollup.step;

    return {
      databaseName,
      merkleRootNew: latestRollupHistory.merkleTreeRoot,
      merkleRootOld: latestRollupHistory.merkleTreeRootPrevious,
      rollUpDifferent,
      rollUpState:
        rollUpDifferent > 0 ? ERollupState.Outdated : ERollupState.Updated,
      latestRollupSuccess:
        rollupOnChainHistory.find(
          (i) => i.status === EMinaTransactionStatus.Applied
        )?.createdAt || null,
      error: latestOnChainRollup.error,
    };
  }
}

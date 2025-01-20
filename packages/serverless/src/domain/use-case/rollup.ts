import { logger } from '@helper';
import {
  ERollupState,
  ETransactionStatus,
  ETransactionType,
  TRollupOffChainHistory,
  TRollupOffChainHistoryParam,
  TRollupOffChainHistoryResponse,
  TRollupOnChainHistoryDataResponse,
  TRollupOnChainHistoryParam,
  TRollupOnChainHistoryResponse,
  TRollupOnChainHistoryTransactionAggregate,
  TRollupOnChainStateResponse,
  databaseName,
} from '@zkdb/common';
import {
  EQueueType,
  ModelGenericQueue,
  ModelMetadataDatabase,
  ModelRollupOffChain,
  ModelRollupOnChainHistory,
  ModelTransaction,
  ModelTransitionLog,
  TCompoundSession,
  zkDatabaseConstant,
} from '@zkdb/storage';
import { ClientSession } from 'mongodb';
import { PublicKey } from 'o1js';
import { Database } from './database.js';
import { Transaction } from './transaction.js';

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

    const latestOffChainRollupProof = await imRollupOffChain.findOne(
      { databaseName },
      {
        session: compoundSession.proofService,
        sort: {
          createdAt: -1,
        },
      }
    );

    if (!latestOffChainRollupProof) {
      throw Error('No proof has been generated yet');
    }

    const imTransitionLog = await ModelTransitionLog.getInstance(
      databaseName,
      compoundSession.proofService
    );

    const transitionLog = await imTransitionLog.findOne({
      _id: latestOffChainRollupProof.transitionLogObjectId,
    });

    if (!transitionLog) {
      throw new Error(
        `Cannot found transition log ${latestOffChainRollupProof.transitionLogObjectId} in rollup ${latestOffChainRollupProof._id}`
      );
    }

    const imRollupOnChainHistory = ModelRollupOnChainHistory.getInstance();
    const imTransaction = ModelTransaction.getInstance();

    const rollUpHistory = await imRollupOnChainHistory.findOne(
      {
        proofId: latestOffChainRollupProof._id,
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

    await imRollupOnChainHistory.insertOne(
      {
        databaseName,
        transactionObjectId,
        merkleRootOnChainNew: transitionLog.merkleRootNew,
        merkleRootOnChainOld: latestOffChainRollupProof.merkleRootOld,
        rollupOffChainObjectId: latestOffChainRollupProof._id,
        createdAt: currentTime,
        updatedAt: currentTime,
        onChainStep: latestOffChainRollupProof.step,
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

    const imRollupOffChainQueue = await ModelGenericQueue.getInstance(
      EQueueType.RollupOffChainQueue,
      session
    );

    // Since mongodb $lookup doesn't support joining 2 collections from 2 databases
    // https://jira.mongodb.org/browse/SERVER-34935

    const rollupOffChainQueue = await imRollupOffChainQueue
      .find(
        {
          databaseName: query.databaseName,
        },
        { session }
      )
      .toArray();

    if (!rollupOffChainQueue.length) {
      return {
        data: [],
        total: 0,
        offset: pagination.offset || 0,
      };
    }

    const imTransitionLog = await ModelTransitionLog.getInstance(
      query.databaseName,
      session
    );

    const transitionLog = await imTransitionLog.find({}, { session }).toArray();

    const transitionLogMap = new Map(
      transitionLog.map((transition) => [transition._id.toString(), transition])
    );

    const rollupOffChainQueueAndTransition: TRollupOffChainHistory[] =
      rollupOffChainQueue.map((rollupOffchain) => {
        const rollupTransition = transitionLogMap.get(
          rollupOffchain.data.transitionLogObjectId.toString()
        );

        if (!rollupTransition) {
          throw new Error(
            `Cannot found transition ${rollupOffchain.data.transitionLogObjectId} in rollup ${rollupOffchain._id}`
          );
        }

        return {
          merkleRootNew: rollupTransition.merkleRootNew,
          merkleRootOld: rollupTransition.merkleRootOld,
          error: rollupOffchain.error,
          docId: rollupOffchain.data.docId,
          status: rollupOffchain.status,
          databaseName: rollupOffchain.databaseName,
          step: BigInt(rollupOffchain.sequenceNumber || 0n) + 1n,
          collectionName: rollupOffchain.data.collectionName,
          acquiredAt: rollupOffchain.acquiredAt || rollupOffchain.createdAt,
        };
      });

    return {
      data: rollupOffChainQueueAndTransition,
      total: rollupOffChainQueueAndTransition.length,
      offset: pagination.offset || 0,
    };
  }

  static async onChainHistory(
    param: TRollupOnChainHistoryParam,
    session?: ClientSession
  ): Promise<TRollupOnChainHistoryResponse> {
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
      throw Error(
        `Database ${metadataDatabase?.databaseName} is not bound to zkApp, please deploy first`
      );
    }

    const imRollupOnChainHistory = ModelRollupOnChainHistory.getInstance();

    const rollupOnChainHistoryAgg = await imRollupOnChainHistory.collection
      .aggregate<TRollupOnChainHistoryTransactionAggregate>(
        [
          {
            $match: { databaseName },
          },
          {
            $sort: { updatedAt: -1, createdAt: -1 },
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
            $addFields: {
              // It's 1-1 relation so the array must have 1 element
              transaction: { $arrayElemAt: ['$transaction', 0] },
            },
          },
        ],
        { session }
      )
      .toArray();

    if (!rollupOnChainHistoryAgg.length) {
      return {
        data: [],
        total: 0,
        offset: pagination.offset || 0,
      };
    }

    // Map to satisfies type `TRollupOnChainHistoryDataResponse` and make sure don't leak any extra fields
    const rollupOnChainHistory: TRollupOnChainHistoryDataResponse[] =
      rollupOnChainHistoryAgg.map(
        ({
          databaseName,
          transaction,
          merkleRootOnChainNew,
          merkleRootOnChainOld,
          onChainStep,
          createdAt,
          updatedAt,
        }) => ({
          // Using spread will leak unexpected data, make sure return what we really need
          databaseName,
          merkleRootOnChainNew,
          merkleRootOnChainOld,
          onChainStep,
          createdAt,
          updatedAt,
          status: transaction.status,
          error: transaction.error,
          txHash: transaction.txHash,
        })
      );

    return {
      data: rollupOnChainHistory,
      total: await imRollupOnChainHistory.count(query),
      offset: pagination.offset || 0,
    };
  }

  static async state(
    databaseName: string
  ): Promise<TRollupOnChainStateResponse> {
    const imRollupOnChainHistory = ModelRollupOnChainHistory.getInstance();
    const imRollupOffChain = ModelRollupOffChain.getInstance();
    // Get latest rollup history
    const rollupOnChainHistory = await imRollupOnChainHistory.collection
      .aggregate<TRollupOnChainHistoryTransactionAggregate>([
        {
          $match: { databaseName },
        },
        {
          $sort: { updatedAt: -1, createdAt: -1 },
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
          $addFields: {
            // It's 1-1 relation so the array must have 1 element
            transaction: { $arrayElemAt: ['$transaction', 0] },
          },
        },
      ])
      .toArray();

    const latestRollupOffChain = await imRollupOffChain.findOne(
      {
        databaseName,
      },
      { sort: { updatedAt: -1, createdAt: -1 } }
    );

    if (!latestRollupOffChain) {
      return null;
    }

    /*
    TRollupOnChainHistoryTransactionAggregate
    */

    // Using Array.prototype.at(0) safer than array[0].
    // We can .at(0) and check undefined instead of arr[0] don't give type check when array is undefined
    const latestRollupOnChain = rollupOnChainHistory.at(0);

    const latestRollupOnChainSuccess = rollupOnChainHistory.find(
      (rollupOnChainHistory) =>
        rollupOnChainHistory.transaction.status === ETransactionStatus.Confirmed
    )?.updatedAt;

    // Rollup different = step(offchain) - step(onchain)
    const rollupDifferent =
      BigInt(latestRollupOffChain.step) -
      BigInt(latestRollupOnChain?.onChainStep || 0n);

    if (rollupDifferent < 0n) {
      throw new Error(
        'Rollup different cannot be less than 0, onchain step always lte offchain step'
      );
    }

    return {
      databaseName,
      merkleRootOnChainNew: latestRollupOnChain?.merkleRootOnChainNew || null,
      merkleRootOnChainOld: latestRollupOnChain?.merkleRootOnChainOld || null,
      rollupDifferent,
      rollupOnChainState:
        rollupDifferent > 0 ? ERollupState.Outdated : ERollupState.Updated,
      latestRollupOnChainSuccess: latestRollupOnChainSuccess || null,
    };
  }
}

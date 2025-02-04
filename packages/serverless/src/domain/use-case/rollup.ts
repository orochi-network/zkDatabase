import { logger } from '@helper';
import {
  EQueueTaskStatus,
  ERollupState,
  ETransactionStatus,
  ETransactionType,
  TRollupOffChainHistory,
  TRollupOffChainHistoryParam,
  TRollupOffChainHistoryResponse,
  TRollupOnChainHistoryDataResponse,
  TRollupOnChainHistoryParam,
  TRollupOnChainHistoryResponse,
  TRollupOnChainStateResponse,
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
} from '@zkdb/storage';
import { ClientSession } from 'mongodb';
import { PublicKey } from 'o1js';
import { Database } from './database';
import { Transaction } from './transaction';

export class Rollup {
  static async create(
    databaseName: string,
    actor: string,
    compoundSession: TCompoundSession
  ): Promise<boolean> {
    await Database.ownershipCheck(
      databaseName,
      actor,
      compoundSession.sessionServerless
    );

    const imMetadataDatabase = ModelMetadataDatabase.getInstance();

    const metadataDatabase = await imMetadataDatabase.findOne(
      { databaseName },
      { session: compoundSession.sessionServerless }
    );

    if (metadataDatabase?.deployStatus !== ETransactionStatus.Confirmed) {
      throw new Error(
        'Database need to be deployed onchain to make rollup onchain. Please deploy database first'
      );
    }

    const imRollupOffChain = ModelRollupOffChain.getInstance();

    const latestOffChainRollupProof = await imRollupOffChain.findOne(
      { databaseName },
      {
        session: compoundSession.sessionMina,
        sort: {
          operationNumber: -1,
          createdAt: -1,
        },
      }
    );

    if (!latestOffChainRollupProof) {
      throw new Error('No proof has been generated yet');
    }

    const imTransitionLog = await ModelTransitionLog.getInstance(
      databaseName,
      compoundSession.sessionMina
    );

    const transitionLog = await imTransitionLog.findOne({
      _id: latestOffChainRollupProof.transitionLogObjectId,
    });

    if (!transitionLog) {
      throw new Error(
        `Cannot found transition log ${
          latestOffChainRollupProof.transitionLogObjectId
        } in rollup ${latestOffChainRollupProof._id}`
      );
    }

    const imRollupOnChainHistory = ModelRollupOnChainHistory.getInstance();

    const rollupOnChainHistory = await imRollupOnChainHistory
      .rollupOnChainHistoryAndTransaction({
        databaseName,
      })
      .toArray();

    // Check reuse proof for rollup history
    const rollupOnChainHistoryWithProof = rollupOnChainHistory.find(
      (e) =>
        e.rollupOffChainObjectId.toString() ===
        latestOffChainRollupProof._id.toString()
    );

    // NOTE: I just refactor code but keep this check old logic from Oleg. Need to check
    if (rollupOnChainHistoryWithProof) {
      logger.debug('Identified repeated proof');
      if (
        rollupOnChainHistoryWithProof.transaction.status ===
        ETransactionStatus.Confirmed
      ) {
        throw new Error('You cannot roll-up the same proof');
      }
      if (
        rollupOnChainHistoryWithProof.transaction.status ===
        ETransactionStatus.Unsigned
      ) {
        throw new Error(
          'You already have uncompleted transaction with the same proof'
        );
      }
    }

    const transactionObjectId = await Transaction.enqueue(
      databaseName,
      actor,
      ETransactionType.Rollup,
      compoundSession.sessionServerless
    );

    const currentTime = new Date();

    const previousOnChainMerkleRootNew =
      rollupOnChainHistory.find(
        (e) => e.transaction.status === ETransactionStatus.Confirmed
      )?.merkleRootNew || null;

    await imRollupOnChainHistory.insertOne(
      {
        databaseName,
        transactionObjectId,
        merkleRootNew: transitionLog.merkleRootNew,
        // latest old merkle root = previous new merkle root
        merkleRootOld: previousOnChainMerkleRootNew,
        rollupOffChainObjectId: latestOffChainRollupProof._id,
        createdAt: currentTime,
        updatedAt: currentTime,
        step: latestOffChainRollupProof.step,
      },
      { session: compoundSession?.sessionServerless }
    );

    return true;
  }

  static async offChainHistory(
    param: TRollupOffChainHistoryParam,
    session: ClientSession
  ): Promise<TRollupOffChainHistoryResponse> {
    //
    const { databaseName, pagination } = param;

    const imRollupOffChainQueue = await ModelGenericQueue.getInstance(
      EQueueType.RollupOffChainQueue,
      session
    );

    // Since mongodb $lookup doesn't support joining 2 collections from 2 databases
    // https://jira.mongodb.org/browse/SERVER-34935

    const rollupOffChainQueue = await imRollupOffChainQueue
      .find(
        {
          databaseName,
        },
        {
          session,
          sort: { createdAt: -1 },
          limit: pagination?.limit,
          skip: pagination?.offset,
        }
      )
      .toArray();

    if (!rollupOffChainQueue.length) {
      return {
        data: [],
        total: 0,
        offset: pagination?.offset || 0,
      };
    }

    const imTransitionLog = await ModelTransitionLog.getInstance(
      databaseName,
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
          step: BigInt(rollupOffchain.sequenceNumber || 0n),
          collectionName: rollupOffchain.data.collectionName,
          acquiredAt: rollupOffchain.acquiredAt || rollupOffchain.createdAt,
        };
      });

    return {
      data: rollupOffChainQueueAndTransition,
      total: rollupOffChainQueueAndTransition.length,
      offset: pagination?.offset || 0,
    };
  }

  static async onChainHistory(
    param: TRollupOnChainHistoryParam,
    session?: ClientSession
  ): Promise<TRollupOnChainHistoryResponse> {
    const { databaseName, pagination } = param;

    const metadataDatabase = await ModelMetadataDatabase.getInstance().findOne(
      { databaseName },
      {
        session,
      }
    );

    if (
      !metadataDatabase?.appPublicKey ||
      PublicKey.fromBase58(metadataDatabase?.appPublicKey).isEmpty().toBoolean()
    ) {
      throw new Error(
        `Database ${metadataDatabase?.databaseName} is not bound to zkApp, please deploy first`
      );
    }

    const imRollupOnChainHistory = ModelRollupOnChainHistory.getInstance();

    const rollupOnChainHistoryAgg = await imRollupOnChainHistory
      .rollupOnChainHistoryAndTransaction(
        {
          databaseName: metadataDatabase?.databaseName,
        },
        pagination,
        session
      )
      .toArray();

    if (!rollupOnChainHistoryAgg.length) {
      return {
        data: [],
        total: 0,
        offset: pagination?.offset || 0,
      };
    }

    // Map to satisfies type `TRollupOnChainHistoryDataResponse` and make sure don't leak any extra fields
    const rollupOnChainHistory: TRollupOnChainHistoryDataResponse[] =
      rollupOnChainHistoryAgg.map(
        ({
          databaseName,
          transaction,
          merkleRootNew,
          merkleRootOld,
          step,
          createdAt,
          updatedAt,
        }) => ({
          // Using spread will leak unexpected data, make sure return what we really need
          databaseName,
          merkleRootNew,
          merkleRootOld,
          step,
          createdAt,
          updatedAt,
          status: transaction.status,
          error: transaction.error,
          txHash: transaction.txHash,
        })
      );

    return {
      data: rollupOnChainHistory,
      total: rollupOnChainHistory.length,
      offset: pagination?.offset || 0,
    };
  }

  static async offChainState(databaseName: string, session: ClientSession) {
    const imRollupOffChain = ModelRollupOffChain.getInstance();

    const imRollupOffChainQueue = await ModelGenericQueue.getInstance(
      EQueueType.RollupOffChainQueue,
      session
    );

    const imTransitionLog = await ModelTransitionLog.getInstance(
      databaseName,
      session
    );

    const latestRollupOffChain = await imRollupOffChain.findOne(
      {
        databaseName,
      },
      { sort: { updatedAt: -1, createdAt: -1 }, session }
    );

    if (!latestRollupOffChain) {
      return null;
    }

    const transitionLog = await imTransitionLog.findOne(
      {
        _id: latestRollupOffChain.transitionLogObjectId,
      },
      { session }
    );

    if (!transitionLog) {
      throw new Error(
        `Cannot found transition log for rollup ${latestRollupOffChain._id}`
      );
    }

    const rollupOffChainQueueList = await imRollupOffChainQueue
      .find(
        {
          databaseName,
        },
        { sort: { updatedAt: -1, createdAt: -1 }, session }
      )
      .toArray();

    if (!rollupOffChainQueueList.length) {
      return null;
    }

    return {
      databaseName,
      merkleRootNew: transitionLog.merkleRootNew,
      merkleRootOld: transitionLog.merkleRootOld,
      rollupOffChainState: rollupOffChainQueueList[0].status,
      latestRollupOffChainSuccess:
        rollupOffChainQueueList.find(
          (queue) => queue.status === EQueueTaskStatus.Success
        )?.updatedAt || null,
    };
  }

  static async onChainState(
    databaseName: string
  ): Promise<TRollupOnChainStateResponse> {
    const imRollupOnChainHistory = ModelRollupOnChainHistory.getInstance();
    const imRollupOffChain = ModelRollupOffChain.getInstance();
    const imTransaction = ModelTransaction.getInstance();

    const transactionDeployConfirmed = await imTransaction.findOne({
      databaseName,
      transactionType: ETransactionType.Deploy,
      status: ETransactionStatus.Confirmed,
    });

    if (!transactionDeployConfirmed) {
      logger.debug(
        `Database ${databaseName} need to be deployed first to make an onchain rollup`
      );
      return null;
    }

    // Get latest rollup history
    const rollupOnChainHistory = await imRollupOnChainHistory
      .rollupOnChainHistoryAndTransaction({
        databaseName,
      })
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

    if (!latestRollupOnChain) {
      return null;
    }

    const latestRollupOnChainSuccess = rollupOnChainHistory.find(
      (e) => e.transaction.status === ETransactionStatus.Confirmed
    )?.updatedAt;

    // Rollup different = step(offchain) - step(onchain)
    const rollupDifferent =
      BigInt(latestRollupOffChain.step) -
      BigInt(latestRollupOnChain?.step || 0n);

    if (rollupDifferent < 0n) {
      throw new Error(
        'Rollup different cannot be less than 0, onchain step always lte offchain step'
      );
    }

    let rollupOnChainState: ERollupState = ERollupState.Unavailable;

    if (rollupDifferent > 0) {
      rollupOnChainState = ERollupState.Outdated;
    } else {
      const imTransaction = ModelTransaction.getInstance();
      const rollupTransaction = await imTransaction.findOne(
        { databaseName, transactionType: ETransactionType.Rollup },
        { sort: { updatedAt: -1, createdAt: -1 } }
      );

      switch (rollupTransaction?.status) {
        case ETransactionStatus.Confirmed:
          rollupOnChainState = ERollupState.Updated;
          break;
        case ETransactionStatus.Confirming:
        case ETransactionStatus.Unconfirmed:
        case ETransactionStatus.Signed:
          rollupOnChainState = ERollupState.Updating;
          break;
        case ETransactionStatus.Failed:
          rollupOnChainState = ERollupState.Failed;
          break;
        default:
          rollupOnChainState = ERollupState.Outdated;
      }
    }

    return {
      databaseName,
      merkleRootNew: latestRollupOnChain.merkleRootNew,
      merkleRootOld: latestRollupOnChain.merkleRootOld || null,
      rollupDifferent,
      rollupOnChainState,
      latestRollupOnChainSuccess: latestRollupOnChainSuccess || null,
    };
  }
}

export default Rollup;

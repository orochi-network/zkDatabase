import { getCurrentTime, logger } from '@helper';
import {
  EMinaTransactionStatus,
  ERollupState,
  ETransactionStatus,
  ETransactionType,
  TRollupHistoryParam,
  TRollupHistoryResponse,
  TRollupStateNullable,
  TRollupStateResponse,
} from '@zkdb/common';
import {
  ModelMetadataDatabase,
  ModelRollupHistory,
  ModelRollupOffChain,
  ModelRollupOnChain,
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

    const imRollupOffChain = ModelRollupOffChain.getInstance();
    const latestProofForDb = await imRollupOffChain.findOne(
      { databaseName },
      {
        sort: {
          createdAt: -1,
        },
        session: compoundSession.proofService,
      }
    );

    if (!latestProofForDb) {
      throw Error('No proof has been generated yet');
    }

    const imRollupHistory = ModelRollupHistory.getInstance();
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

    const currentTime = getCurrentTime();

    await imRollupHistory.insertOne(
      {
        databaseName,
        transactionObjectId,
        // @NOTICE Something possible wrong here
        merkleTreeRoot: latestProofForDb.merkleRootNew,
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

  static async history(
    param: TRollupHistoryParam,
    session?: ClientSession
  ): Promise<TRollupHistoryResponse | null> {
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

    const imRollupHistory = ModelRollupHistory.getInstance();

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

  static async state(databaseName: string): Promise<TRollupStateResponse> {
    const imRollupOnChain = ModelRollupOnChain.getInstance();
    const imRollupHistory = ModelRollupHistory.getInstance();

    // Get latest rollup history
    const latestRollupHistory = await imRollupHistory.findOne(
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
      merkleTreeRoot: latestRollupHistory.merkleTreeRoot,
      merkleTreeRootPrevious: latestRollupHistory.merkleTreeRootPrevious,
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

import { getCurrentTime, logger } from '@helper';
import {
  ERollupState,
  ETransactionStatus,
  ETransactionType,
  TRollupHistoryDetail,
} from '@zkdb/common';
import { ZkDbProcessor } from '@zkdb/smart-contract';
import {
  ModelMetadataDatabase,
  ModelProof,
  ModelRollupHistory,
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

    const imProof = ModelProof.getInstance();
    const latestProofForDb = await imProof.findOne(
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
        merkleTreeRoot: latestProofForDb.merkleRoot,
        merkleTreeRootPrevious: latestProofForDb.merkleRootPrevious,
        proofObjectId: latestProofForDb._id,
        createdAt: currentTime,
        updatedAt: currentTime,
        error: '',
        step: latestProofForDb.step,
      },
      { session: compoundSession?.serverless }
    );

    return true;
  }

  static async history(
    databaseName: string,
    session?: ClientSession
  ): Promise<TRollupHistoryDetail | null> {
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

    const zkDbProcessor = new ZkDbProcessor(database.merkleHeight);
    const zkDbSmartContract = zkDbProcessor.getInstanceZkDBContract(
      PublicKey.fromBase58(database.appPublicKey)
    );
    const onChainRollupStep = zkDbSmartContract.step.get().toBigInt();
    const imRollupHistory = ModelRollupHistory.getInstance();

    const rollupHistory = await imRollupHistory
      .find({ databaseName })
      .sort({ createdAt: -1, updatedAt: -1 })
      .toArray();

    const latestRollupHistory = rollupHistory.at(0);

    if (latestRollupHistory) {
      const rollUpDifferent = onChainRollupStep - rollupHistory[0].step;

      return {
        databaseName,
        merkleTreeRoot: latestRollupHistory.merkleTreeRoot,
        merkleTreeRootPrevious: latestRollupHistory.merkleTreeRootPrevious,
        latestRollupSuccess: new Date(),
        rollUpDifferent,
        rollUpState:
          rollUpDifferent > 0 ? ERollupState.Outdated : ERollupState.Updated,
        history: rollupHistory,
        error: latestRollupHistory.error,
      };
    }

    return null;
  }
}

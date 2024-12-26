import { getCurrentTime, logger } from '@helper';
import {
  ERollUpState,
  ETransactionStatus,
  ETransactionType,
  TRollUpDetail,
  TRollUpHistoryDetail,
} from '@zkdb/common';
import { MinaNetwork } from '@zkdb/smart-contract';
import {
  ModelMerkleTree,
  ModelMetadataDatabase,
  ModelProof,
  ModelQueueTask,
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
        merkletreeRoot: latestProofForDb.merkleRoot,
        merkletreeRootPrevious: latestProofForDb.merkleRootPrevious,
        proofObjectId: latestProofForDb._id,
        createdAt: currentTime,
        updatedAt: currentTime,
      },
      { session: compoundSession?.serverless }
    );

    return true;
  }

  static async history(
    databaseName: string,
    session?: ClientSession
  ): Promise<TRollUpDetail> {
    const imRollupHistory = ModelRollupHistory.getInstance();
    const minaNetwork = MinaNetwork.getInstance();
    const imQueue = ModelQueueTask.getInstance();

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

    const { account, error } = await minaNetwork.getAccount(
      PublicKey.fromBase58(database.appPublicKey)
    );

    if (!account) {
      throw Error(
        `zk app with ${database.appPublicKey} is not exist in mina network. Error: ${error}`
      );
    }

    const zkApp = account.zkapp;

    if (!zkApp) {
      throw Error('The account in not zk app');
    }

    const merkleRoot = zkApp.appState[0];

    let rolledUpTaskNumber: number;

    const task = await imQueue.findOne({
      database: databaseName,
      merkleRoot: merkleRoot.toString(),
    });

    if (
      merkleRoot
        .equals(ModelMerkleTree.getEmptyRoot(database.merkleHeight))
        .toBoolean()
    ) {
      rolledUpTaskNumber = 0;
    } else if (task) {
      rolledUpTaskNumber = task.operationNumber;
    } else {
      throw Error('Wrong zkapp state');
    }

    const pipeline = [
      {
        $match: { databaseName },
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
        $lookup: {
          from: zkDatabaseConstant.globalCollection.proof,
          localField: 'proofObjectId',
          foreignField: '_id',
          as: 'proof',
        },
      },
      {
        $sort: { createdAt: -1 },
      },
      {
        $project: {
          transactionObjectId: 0,
          proofObjectId: 0,
        },
      },
    ];

    const listRollupHistoryDetail = (await imRollupHistory.collection
      .aggregate(pipeline)
      .toArray()) as TRollUpHistoryDetail[];

    const latestTask = await imQueue.findOne(
      {
        database: databaseName,
      },
      { sort: { createdAt: -1 } }
    );

    if (!latestTask) {
      throw new Error('Latest task not found');
    }

    const diff = latestTask.operationNumber - rolledUpTaskNumber;

    let rollUpState: ERollUpState = ERollUpState.Failed;

    // @NOTICE transaction status must be updated in cron job.
    if (diff > 0) {
      rollUpState = ERollUpState.Outdated;
    } else if (
      listRollupHistoryDetail[0].transaction.status ===
      ETransactionStatus.Confirmed
    ) {
      rollUpState = ERollUpState.Updated;
    }

    return {
      history: listRollupHistoryDetail,
      state: rollUpState,
      rollUpDifferent: diff,
    };
  }
}

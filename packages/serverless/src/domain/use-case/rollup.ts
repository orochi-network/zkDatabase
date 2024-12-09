import {
  ERollUpState,
  ETransactionStatus,
  ETransactionType,
  RollUpData,
  TRollUpHistory,
  TTransaction,
} from '@zkdb/common';
import { MinaNetwork } from '@zkdb/smart-contract';
import {
  CompoundSession,
  ModelMetadataDatabase,
  ModelMerkleTree,
  ModelProof,
  ModelQueueTask,
  ModelRollup,
  ModelTransaction,
} from '@zkdb/storage';
import { ClientSession } from 'mongodb';
import { PublicKey } from 'o1js';
import logger from '../../helper/logger.js';
import Transaction from './transaction.js';

export async function createRollUp(
  databaseName: string,
  actor: string,
  compoundSession?: CompoundSession
) {
  const modelProof = ModelProof.getInstance();
  const latestProofForDb = await modelProof.getProof(databaseName, {
    session: compoundSession?.sessionProof,
  });

  if (!latestProofForDb) {
    throw Error('No proof has been generated yet');
  }

  const modelRollUp = ModelRollup.getInstance();
  const modelTransaction = ModelTransaction.getInstance();

  const rollUp = await modelRollUp.collection.findOne({
    proofId: latestProofForDb._id,
  });

  if (rollUp) {
    logger.debug('Identified repeated proof');

    const transaction = await modelTransaction.findById(
      rollUp.transactionObjectId.toString()
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

  const txId = await Transaction.enqueue(
    databaseName,
    actor,
    ETransactionType.Rollup,
    compoundSession?.sessionService
  );

  await modelRollUp.create(
    {
      previousMerkleTreeRoot: latestProofForDb.prevMerkleRoot,
      currentMerkleTreeRoot: latestProofForDb.merkleRoot,
      databaseName: databaseName,
      transactionObjectId: txId,
      proofObjectId: latestProofForDb._id,
      status: ETransactionStatus.Unsigned,
      transactionHash: '',
    },
    { session: compoundSession?.sessionService }
  );
}

export async function getRollUpHistory(
  databaseName: string,
  session?: ClientSession
): Promise<RollUpData> {
  const modelRollUp = ModelRollup.getInstance();
  const modelTransaction = ModelTransaction.getInstance();
  const minaNetwork = MinaNetwork.getInstance();
  const queue = ModelQueueTask.getInstance();
  const database = await ModelMetadataDatabase.getInstance().getDatabase(
    databaseName,
    {
      session,
    }
  );

  if (!database?.appPublicKey) {
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

  const task = await queue.collection.findOne({
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

  const latestTask = await queue.collection.findOne(
    {
      database: databaseName,
    },
    { sort: { createdAt: -1 } }
  );

  const diff = latestTask!.operationNumber - rolledUpTaskNumber;

  const rollUpList = await modelRollUp.collection
    .find({ databaseName })
    .toArray();

  const buildRollUpHistory = (
    history: TRollUpHistory,
    transaction: TTransaction,
    status: ETransactionStatus,
    error?: string
  ) => ({
    databaseName: history.databaseName,
    currentMerkleTreeRoot: history.currentMerkleTreeRoot,
    previousMerkleTreeRoot: history.previousMerkleTreeRoot,
    transactionObjectId: history.transactionObjectId,
    proofObjectId: history.proofObjectId,
    transactionRaw: transaction.transactionRaw,
    txHash: transaction?.txHash,
    createdAt: transaction.createdAt,
    transactionHash: transaction?.txHash,
    status,
    error,
  });

  const history = (
    await Promise.all(
      rollUpList.map(async (history) => {
        const transaction = await modelTransaction.findById(
          history.transactionObjectId.toString()
        );

        if (!transaction) {
          logger.error('Transaction for history not found. It is impossible');
          return null;
        }

        if (transaction.status === ETransactionStatus.Confirming) {
          if (!transaction.txHash) {
            logger.error('Transaction hash not found for pending transaction');
            return null;
          }

          const tx = await minaNetwork.getZkAppTransactionByTxHash(
            transaction.txHash
          );

          if (tx) {
            if (tx.txStatus === 'applied') {
              await modelTransaction.updateById(
                history.transactionObjectId.toString(),
                {
                  status: ETransactionStatus.Confirmed,
                  error: undefined,
                },
                { session }
              );
              return buildRollUpHistory(
                history,
                transaction,
                ETransactionStatus.Signed
              );
            } else if (tx.txStatus === 'failed') {
              await modelTransaction.updateById(
                history.transactionObjectId.toString(),
                {
                  status: ETransactionStatus.Failed,
                  error: tx.failures.join(' '),
                },
                { session }
              );
              return buildRollUpHistory(
                history,
                transaction,
                ETransactionStatus.Failed,
                tx.failures.join(' ')
              );
            }
          }
        } else {
          return buildRollUpHistory(
            history,
            transaction,
            transaction.status,
            transaction.error
          );
        }

        logger.error('Transaction status could not be verified');
        return buildRollUpHistory(
          history,
          transaction,
          ETransactionStatus.Unknown,
          transaction.error
        );
      })
    )
  )
    .filter((item) => item !== null)
    .sort((a, b) => {
      return a.createdAt.getTime() - b.createdAt.getTime();
    });

  let rollUpState: ERollUpState = ERollUpState.Updated;

  if (diff > 0) {
    rollUpState = ERollUpState.Outdated;
  } else if (
    history[history.length - 1] &&
    history[history.length - 1].status === ETransactionStatus.Failed
  ) {
    rollUpState = ERollUpState.Failed;
  }

  return {
    history,
    state: rollUpState,
    extraData: diff,
  };
}

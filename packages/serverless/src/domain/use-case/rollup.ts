import {
  DbTransaction,
  ModelDbSetting,
  ModelDbTransaction,
  ModelMerkleTree,
  ModelProof,
  ModelQueueTask,
  ModelRollup,
  RollupHistory as RollupHistoryModel,
  TransactionStatus,
} from '@zkdb/storage';
import { ClientSession } from 'mongodb';
import { enqueueTransaction } from './transaction.js';
import { MinaNetwork } from '@zkdb/smart-contract';
import { RollUpData, RollUpHistory, RollUpState } from '../types/rollup.js';
import logger from '../../helper/logger.js';
import { PublicKey } from 'o1js';

export async function createRollUp(
  databaseName: string,
  actor: string,
  session?: ClientSession
) {
  const modelProof = ModelProof.getInstance();
  const latestProofForDb = await modelProof.getProof(databaseName, { session });

  if (!latestProofForDb) {
    throw Error('No proof has been generated yet');
  }

  const modelRollUp = ModelRollup.getInstance();

  const txId = await enqueueTransaction(databaseName, actor, 'rollup', session);

  await modelRollUp.create(
    {
      merkleRoot: latestProofForDb.prevMerkleRoot,
      newMerkleRoot: latestProofForDb.merkleRoot,
      databaseName: databaseName,
      txId,
    },
    { session }
  );
}

export async function getRollUpHistory(
  databaseName: string,
  session?: ClientSession
): Promise<RollUpData> {
  const modelRollUp = ModelRollup.getInstance();
  const modelTransaction = ModelDbTransaction.getInstance();
  const minaNetwork = MinaNetwork.getInstance();
  const queue = ModelQueueTask.getInstance();
  const dbSetting = await ModelDbSetting.getInstance().getSetting(
    databaseName,
    { session }
  );

  ModelMerkleTree;

  if (!dbSetting?.appPublicKey) {
    throw Error('Database is not bound to zk app');
  }

  const { account, error } = await minaNetwork.getAccount(
    PublicKey.fromBase58(dbSetting.appPublicKey)
  );

  if (!account) {
    throw Error(
      `zk app with ${dbSetting.appPublicKey} is not exist in mina network. Error: ${error}`
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
    merkleRoot,
  });

  if (
    merkleRoot
      .equals(ModelMerkleTree.getEmptyRoot(dbSetting.merkleHeight))
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
    history: RollupHistoryModel,
    transaction: DbTransaction,
    status: TransactionStatus,
    error?: string
  ) => ({
    databaseName: history.databaseName,
    currentMerkleTreeRoot: history.merkleRoot,
    previousMerkleTreeRoot: history.newMerkleRoot,
    createdAt: transaction.createdAt,
    transactionHash: transaction?.txHash,
    status,
    error,
  });

  const history = (
    await Promise.all(
      rollUpList.map(async (history) => {
        const transaction = await modelTransaction.findById(
          history.txId.toString()
        );

        if (!transaction) {
          logger.error('Transaction for history not found. It is impossible');
          return null;
        }

        if (transaction.status === 'pending') {
          if (!transaction.txHash) {
            logger.error('Transaction hash not found for pending transaction');
            return null;
          }

          const tx = await minaNetwork.getTransactionStatusByHash(
            transaction.txHash
          );

          if (tx) {
            if (tx.txStatus === 'applied') {
              await modelTransaction.updateById(
                history.txId.toString(),
                {
                  status: 'success',
                  error: undefined,
                },
                { session }
              );
              return buildRollUpHistory(history, transaction, 'success');
            } else if (tx.txStatus === 'failed') {
              await modelTransaction.updateById(
                history.txId.toString(),
                {
                  status: 'failed',
                  error: tx.failureReason,
                },
                { session }
              );
              return buildRollUpHistory(
                history,
                transaction,
                'failed',
                tx.failureReason
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
        return null;
      })
    )
  )
    .filter((item) => item !== null)
    .sort((a, b) => {
      return a.createdAt.getTime() - b.createdAt.getTime();
    });

  let rollUpState: RollUpState = 'updated';

  if (diff > 0) {
    rollUpState = 'outdated';
  } else if (history[0] && history[0].status === 'failed') {
    rollUpState = 'failed';
  }

  return {
    history,
    state: rollUpState,
    extraData: diff,
  };
}

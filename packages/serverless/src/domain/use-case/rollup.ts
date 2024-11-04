import {
  DbTransaction,
  ModelDbTransaction,
  ModelProof,
  ModelRollup,
  RollupHistory as RollupHistoryModel,
  TransactionStatus,
} from '@zkdb/storage';
import { ClientSession } from 'mongodb';
import { enqueueTransaction } from './transaction';
import { MinaNetwork } from '@zkdb/smart-contract';
import { RollUpHistory } from '../types/rollup';
import logger from '../../helper/logger';

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

  const txId = await enqueueTransaction(databaseName, actor, 'rollup');

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
): Promise<Array<RollUpHistory>> {
  const modelRollUp = ModelRollup.getInstance();
  const modelTransaction = ModelDbTransaction.getInstance();
  const minaNetwork = MinaNetwork.getInstance();

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

  const result = await Promise.all(
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
            await modelTransaction.updateById(history.txId.toString(), {
              status: 'success',
              error: undefined,
            });
            return buildRollUpHistory(history, transaction, 'success');
          } else if (tx.txStatus === 'failed') {
            await modelTransaction.updateById(history.txId.toString(), {
              status: 'failed',
              error: tx.failureReason,
            });
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
  );

  return result.filter((item) => item !== null);
}

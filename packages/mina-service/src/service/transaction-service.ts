import { config, logger } from '@helper';
import { Fill, QueueLoop, TimeDuration } from '@orochi-network/queue';
import { ETransactionStatus, ETransactionType } from '@zkdb/common';
import { MinaNetwork } from '@zkdb/smart-contract';
import { DatabaseEngine, ModelTransaction, Transaction } from '@zkdb/storage';
import { TransactionOnChain } from '@domain';
// Time duration is equal 1/10 time on chain
const PADDING_TIME = TimeDuration.fromMinute(1);

export const SERVICE_TRANSACTION = {
  clusterName: 'transaction',
  payload: async () => {
    let isRunning = false;

    // Connect to db
    const serverlessDb = DatabaseEngine.getInstance(config.MONGODB_URL);
    const proofDb = DatabaseEngine.getInstance(config.PROOF_MONGODB_URL);

    if (!serverlessDb.isConnected()) {
      await serverlessDb.connect();
    }

    if (!proofDb.isConnected()) {
      await proofDb.connect();
    }

    const queue = new QueueLoop();

    // Listening to error
    queue.on('error', (taskName: string, err: Error) => {
      logger.error('Task:', taskName, 'Error:', err);
    });

    queue.add(
      'get-transaction',
      async () => {
        if (isRunning) {
          logger.debug('Task skipped to prevent overlap: ', new Date());
          return;
        }

        isRunning = true;

        logger.info('Transaction service task started ', new Date());
        const imTransaction = ModelTransaction.getInstance();
        // Get list transaction that unconfirmed
        const transactionList = await imTransaction
          .find({
            status: {
              $in: [
                ETransactionStatus.Signed,
                ETransactionStatus.Unconfirmed,
                ETransactionStatus.Confirming,
              ],
            },
          })
          .toArray();

        if (transactionList.length > 0) {
          await Fill(
            transactionList.map((transaction) => async () => {
              Transaction.serverless(async (session) => {
                const minaNetwork = MinaNetwork.getInstance();

                minaNetwork.connect(
                  config.NETWORK_ID,
                  config.MINA_URL,
                  config.BLOCKBERRY_API_KEY
                );

                // Ensure txHash existed
                if (transaction.txHash) {
                  const minaZkAppTx =
                    await minaNetwork.getZkAppTransactionByTxHash(
                      transaction.txHash
                    );

                  logger.debug(
                    `zkApp address mina transaction hash ${transaction.txHash}: `,
                    minaZkAppTx
                  );

                  if (transaction.transactionType === ETransactionType.Deploy) {
                    await TransactionOnChain.deploy(
                      transaction._id,
                      minaZkAppTx,
                      session
                    );
                  }

                  if (transaction.transactionType === ETransactionType.Rollup) {
                    await TransactionOnChain.rollup(
                      transaction._id,
                      minaZkAppTx,
                      session
                    );
                  }
                }
              });
            })
          );
        }

        isRunning = false;
      },
      PADDING_TIME
    );

    queue.start();
  },
};

export default SERVICE_TRANSACTION;

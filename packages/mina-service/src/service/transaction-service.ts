import { config, logger } from '@helper';
import { Fill, QueueLoop, TimeDuration } from '@orochi-network/queue';
import { ETransactionStatus } from '@zkdb/common';
import { MinaNetwork } from '@zkdb/smart-contract';
import { DatabaseEngine, ModelTransaction } from '@zkdb/storage';

const PADDING_TIME = TimeDuration.fromMinute(2);

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
          logger.debug('Task skipped to prevent overlap:', new Date());
          return;
        }

        isRunning = true;

        logger.info('Transaction service task started ', new Date());
        const imTransaction = ModelTransaction.getInstance();
        // Get list transaction that unconfirmed
        const transactionList = await imTransaction
          .find({
            status: {
              $in: [ETransactionStatus.Signed, ETransactionStatus.Unconfirmed],
            },
          })
          .toArray();

        if (transactionList.length > 0) {
          await Fill(
            transactionList.map((transaction) => async () => {
              const minaNetwork = MinaNetwork.getInstance();
              // Ensure txHash existed
              if (transaction.txHash) {
                const zkAppTx = await minaNetwork.getZkAppTransactionByTxHash(
                  transaction.txHash
                );

                if (!zkAppTx) {
                  // Transaction not found in Mina, which mean unconfirmed
                  await imTransaction.updateOne(
                    { _id: transaction._id },
                    {
                      $set: {
                        status: ETransactionStatus.Unconfirmed,
                      },
                    }
                  );
                  return;
                }

                if (zkAppTx.failures && zkAppTx.failures.length > 0) {
                  await imTransaction.updateOne(
                    { _id: transaction._id },
                    {
                      $set: {
                        status: ETransactionStatus.Failed,
                        error: zkAppTx.failures.join(' '),
                      },
                    }
                  );

                  return;
                }

                if (zkAppTx.txStatus === 'applied') {
                  // Transaction is confirmed on Mina
                  await imTransaction.updateOne(
                    { _id: transaction._id },
                    {
                      $set: {
                        status: ETransactionStatus.Confirmed,
                      },
                    }
                  );

                  return;
                } else if (zkAppTx.txStatus === 'pending') {
                  // Transaction is <= 1 confirmation, which still in mempool
                  const updateResult = await imTransaction.updateOne(
                    { _id: transaction._id },
                    {
                      $set: {
                        status: ETransactionStatus.Confirming,
                      },
                    }
                  );

                  return;
                } else if (zkAppTx.txStatus === 'failed') {
                  // Transaction is failed
                  await imTransaction.updateOne(
                    { _id: transaction._id },
                    {
                      $set: {
                        status: ETransactionStatus.Failed,
                        error: '',
                      },
                    }
                  );

                  return;
                } else {
                  // Unknown tx status case
                  await imTransaction.updateOne(
                    {
                      _id: transaction._id,
                    },
                    {
                      $set: {
                        status: ETransactionStatus.Unknown,
                        error: `An supported type of unknown transaction ${zkAppTx.txStatus}`,
                      },
                    }
                  );

                  return;
                }
              }
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

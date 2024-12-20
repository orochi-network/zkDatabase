import { config, logger } from '@helper';
import { Fill } from '@orochi-network/queue';
import { ETransactionStatus } from '@zkdb/common';
import { MinaNetwork } from '@zkdb/smart-contract';
import { DatabaseEngine, ModelTransaction } from '@zkdb/storage';
import { schedule } from 'node-cron';

// Base on Mina protocol blockscan we divide to 10
const CRON_SCHEDULE = '*/2 * * * *'; // Cron expression to run every 2 minutes

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

    schedule(CRON_SCHEDULE, async () => {
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
    });
  },
};

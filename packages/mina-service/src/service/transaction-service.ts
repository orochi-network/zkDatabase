import { MinaNetwork } from '@zkdb/smart-contract';
import { ModelTransaction } from '@zkdb/storage';
import { schedule } from 'node-cron';
import { ETransactionStatus, ETransactionType } from '@zkdb/common';

const CRON_SCHEDULE = '*/30 * * * *'; // Cron expression to run every 30 minutes

export const SERVICE_COMPILE = {
  clusterName: 'transaction',
  payload: async () => {
    schedule(CRON_SCHEDULE, async () => {
      const imTransaction = ModelTransaction.getInstance();
      // Get list transaction that unconfirmed
      const transactionList = await imTransaction
        .find({
          status: {
            $in: [ETransactionStatus.Unconfirmed],
          },
        })
        .toArray();

      if (transactionList.length > 0) {
        transactionList.map((transaction) => async () => {
          const minaNetwork = MinaNetwork.getInstance();
          // Ensure txHash existed
          if (transaction.txHash) {
            const tx = await minaNetwork.getZkAppTransactionByTxHash(
              transaction.txHash
            );

            if (!tx) {
              throw new Error('Transaction not found on Mina');
              // Transaction not found in Mina, which mean processing
            }
            tx.txStatus === '';

            if (tx.txStatus === 'applied') {
              await imTransaction.updateOne(
                { _id: transaction._id },
                {
                  $set: {
                    transactionStatus: ETransactionStatus.Confirmed,
                  },
                }
              );
            } else if (tx.txStatus === 'pending') {
              await imTransaction.updateOne(
                { _id: transaction._id },
                {
                  $set: {
                    transactionStatus: ETransactionStatus.Confirming,
                  },
                }
              );
            }
          }
        });
      }
    });
  },
};

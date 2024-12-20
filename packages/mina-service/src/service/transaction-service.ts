import { Fill } from '@orochi-network/queue';
import { ETransactionStatus } from '@zkdb/common';
import { MinaNetwork } from '@zkdb/smart-contract';
import { ModelTransaction } from '@zkdb/storage';
import { schedule } from 'node-cron';
// Base on Mina protocol blockscan we divide to 10
const CRON_SCHEDULE = '*/2 * * * *'; // Cron expression to run every 30 minutes

export const SERVICE_TRANSACTION = {
  clusterName: 'transaction',
  payload: async () => {
    schedule(CRON_SCHEDULE, async () => {
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
        const result = await Fill(
          transactionList
            .map((transaction) => async () => {
              const minaNetwork = MinaNetwork.getInstance();
              // Ensure txHash existed
              if (transaction.txHash) {
                const zkAppTx = await minaNetwork.getZkAppTransactionByTxHash(
                  transaction.txHash
                );

                if (!zkAppTx) {
                  // Transaction not found in Mina, which mean unconfirmed
                  const updateResult = await imTransaction.updateOne(
                    { _id: transaction._id },
                    {
                      $set: {
                        status: ETransactionStatus.Unconfirmed,
                      },
                    }
                  );
                  return updateResult.acknowledged;
                }

                if (zkAppTx.failures && zkAppTx.failures.length > 0) {
                  const updateResult = await imTransaction.updateOne(
                    { _id: transaction._id },
                    {
                      $set: {
                        status: ETransactionStatus.Failed,
                        error: zkAppTx.failures.join(' '),
                      },
                    }
                  );

                  return updateResult.acknowledged;
                }

                if (zkAppTx.txStatus === 'applied') {
                  // Transaction is confirmed on Mina
                  const updateResult = await imTransaction.updateOne(
                    { _id: transaction._id },
                    {
                      $set: {
                        status: ETransactionStatus.Confirmed,
                      },
                    }
                  );

                  return updateResult.acknowledged;
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

                  return updateResult.acknowledged;
                } else if (zkAppTx.txStatus === 'failed') {
                  // Transaction is failed
                  const updateResult = await imTransaction.updateOne(
                    { _id: transaction._id },
                    {
                      $set: {
                        status: ETransactionStatus.Failed,
                      },
                    }
                  );

                  return updateResult.acknowledged;
                } else {
                  // Unknown tx status case
                  return imTransaction.updateOne(
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
                }
              }
            })
            .map((v) => v)
        );
      }
    });
  },
};

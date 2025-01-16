import { config, logger } from '@helper';
import { Fill, QueueLoop, TimeDuration } from '@orochi-network/queue';
import {
  EMinaTransactionStatus,
  ETransactionStatus,
  ETransactionType,
} from '@zkdb/common';
import { MinaNetwork, ZkDbProcessor } from '@zkdb/smart-contract';
import {
  DatabaseEngine,
  ModelMetadataDatabase,
  ModelRollupOnChainHistory,
  ModelTransaction,
  withTransaction,
} from '@zkdb/storage';
import { PublicKey } from 'o1js';
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
        const imMetadataDatabase = ModelMetadataDatabase.getInstance();
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
              withTransaction(async (session) => {
                const minaNetwork = MinaNetwork.getInstance();

                minaNetwork.connect(
                  config.NETWORK_ID,
                  config.MINA_URL,
                  config.BLOCKBERRY_API_KEY
                );

                // Ensure txHash existed
                if (transaction.txHash) {
                  const zkAppTx = await minaNetwork.getZkAppTransactionByTxHash(
                    transaction.txHash
                  );

                  logger.debug(
                    `zkApp transaction: ${transaction.txHash}: `,
                    zkAppTx
                  );

                  if (!zkAppTx) {
                    // Transaction not found in Mina, which mean unconfirmed
                    const updatedTransaction =
                      await imTransaction.collection.findOneAndUpdate(
                        {
                          _id: transaction._id,
                          status: {
                            // We skip the confirming
                            // Sometime the rpc Mina chain won't stable that throw 404
                            // That lead to confirming status back to unconfirmed
                            $nin: [ETransactionStatus.Confirming],
                          },
                        },
                        {
                          $set: {
                            status: ETransactionStatus.Unconfirmed,
                          },
                        },
                        { session }
                      );
                    // If Rollup => early return, we don't need to update the metadata database deploy status
                    if (
                      !updatedTransaction ||
                      updatedTransaction.transactionType ===
                        ETransactionType.Rollup
                    ) {
                      return;
                    }

                    await imMetadataDatabase.updateOne(
                      {
                        databaseName: updatedTransaction.databaseName,
                      },
                      {
                        $set: {
                          deployStatus: ETransactionStatus.Unconfirmed,
                        },
                      },
                      {
                        session,
                      }
                    );

                    return;
                  }

                  if (zkAppTx.failures && zkAppTx.failures.length > 0) {
                    const updatedTransaction =
                      await imTransaction.collection.findOneAndUpdate(
                        {
                          _id: transaction._id,
                        },
                        {
                          $set: {
                            status: ETransactionStatus.Failed,
                            error: zkAppTx.failures.join(' '),
                          },
                        },
                        {
                          session,
                        }
                      );

                    // If Rollup => early return, we don't need to update the metadata database deploy status
                    if (
                      !updatedTransaction ||
                      updatedTransaction.transactionType ===
                        ETransactionType.Rollup
                    ) {
                      return;
                    }

                    await imMetadataDatabase.updateOne(
                      {
                        databaseName: updatedTransaction.databaseName,
                      },
                      {
                        $set: {
                          deployStatus: ETransactionStatus.Failed,
                        },
                      },
                      { session }
                    );

                    return;
                  }

                  if (zkAppTx.txStatus === 'applied') {
                    // Transaction is confirmed on Mina

                    const updatedTransaction =
                      await imTransaction.collection.findOneAndUpdate(
                        {
                          _id: transaction._id,
                        },
                        {
                          $set: {
                            status: ETransactionStatus.Confirmed,
                          },
                        },
                        {
                          session,
                        }
                      );

                    if (
                      updatedTransaction?.transactionType ===
                      ETransactionType.Rollup
                    ) {
                      // Insert on chain info
                      // NOTE: Do get onchain data from smart contract or we get from transaction
                      const metadataDatabase = await imMetadataDatabase.findOne(
                        { databaseName: updatedTransaction.databaseName }
                      );

                      if (!metadataDatabase) {
                        throw new Error(
                          `Cannot found metadata database ${updatedTransaction.databaseName}`
                        );
                      }

                      const zkDbProcessor = await ZkDbProcessor.getInstance(
                        metadataDatabase.merkleHeight
                      );

                      const zkDbContract =
                        zkDbProcessor.getInstanceZkDBContract(
                          PublicKey.fromBase58(metadataDatabase.appPublicKey)
                        );

                      await ModelRollupOnChainHistory.getInstance().updateOne(
                        {
                          databaseName: updatedTransaction.databaseName,
                          transactionObjectId: transaction._id,
                        },
                        {
                          $set: {
                            step: zkDbContract.step.get().toBigInt(),
                            updatedAt: new Date(),
                          },
                        }
                      );
                    } else if (
                      updatedTransaction?.transactionType ===
                      ETransactionType.Deploy
                    ) {
                      await imMetadataDatabase.updateOne(
                        {
                          databaseName: updatedTransaction.databaseName,
                        },
                        {
                          $set: {
                            deployStatus: ETransactionStatus.Confirmed,
                          },
                        },
                        {
                          session,
                        }
                      );
                    }

                    return;
                  } else if (zkAppTx.txStatus === 'pending') {
                    // Transaction is <= 1 confirmation, which still in mempool
                    const updatedTransaction =
                      await imTransaction.collection.findOneAndUpdate(
                        {
                          _id: transaction._id,
                        },
                        {
                          $set: {
                            status: ETransactionStatus.Confirming,
                          },
                        },
                        {
                          session,
                        }
                      );

                    // If Rollup => early return, we don't need to update the metadata database deploy status
                    if (
                      !updatedTransaction ||
                      updatedTransaction.transactionType ===
                        ETransactionType.Rollup
                    ) {
                      return;
                    }

                    await imMetadataDatabase.updateOne(
                      {
                        databaseName: updatedTransaction.databaseName,
                      },
                      {
                        $set: {
                          deployStatus: ETransactionStatus.Confirming,
                        },
                      },
                      {
                        session,
                      }
                    );

                    return;
                  } else if (zkAppTx.txStatus === 'failed') {
                    // Transaction is failed

                    const updatedTransaction =
                      await imTransaction.collection.findOneAndUpdate(
                        {
                          _id: transaction._id,
                        },
                        {
                          $set: {
                            status: ETransactionStatus.Failed,
                            error: `zk transaction ${transaction.txHash} is failed`,
                          },
                        },
                        {
                          session,
                        }
                      );

                    // If Rollup => early return, we don't need to update the metadata database deploy status
                    if (
                      !updatedTransaction ||
                      updatedTransaction.transactionType ===
                        ETransactionType.Rollup
                    ) {
                      return;
                    }

                    await ModelRollupOnChainHistory.getInstance().updateOne(
                      {
                        databaseName: updatedTransaction.databaseName,
                        transactionObjectId: transaction._id,
                      },
                      {
                        $set: {
                          error: zkAppTx.failures.join(' '),
                          updatedAt: new Date(),
                        },
                      }
                    );

                    await imMetadataDatabase.updateOne(
                      {
                        databaseName: updatedTransaction.databaseName,
                      },
                      {
                        $set: {
                          deployStatus: ETransactionStatus.Failed,
                        },
                      },
                      {
                        session,
                      }
                    );

                    return;
                  } else {
                    // Unknown tx status case

                    const updatedTransaction =
                      await imTransaction.collection.findOneAndUpdate(
                        {
                          _id: transaction._id,
                        },
                        {
                          $set: {
                            status: ETransactionStatus.Unknown,
                            error: `An supported type of unknown transaction ${zkAppTx.txStatus}`,
                          },
                        },
                        {
                          session,
                        }
                      );

                    // If Rollup => early return, we don't need to update the metadata database deploy status
                    if (
                      !updatedTransaction ||
                      updatedTransaction.transactionType ===
                        ETransactionType.Rollup
                    ) {
                      return;
                    }

                    await imMetadataDatabase.updateOne(
                      {
                        databaseName: updatedTransaction.databaseName,
                      },
                      {
                        $set: {
                          deployStatus: ETransactionStatus.Unknown,
                        },
                      },
                      {
                        session,
                      }
                    );

                    return;
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

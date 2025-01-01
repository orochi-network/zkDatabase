import { config, logger } from '@helper';
import { Fill, QueueLoop, TimeDuration } from '@orochi-network/queue';
import {
  ERollUpState,
  ETransactionStatus,
  TRollUpHistoryDetail,
} from '@zkdb/common';
import { MinaNetwork } from '@zkdb/smart-contract';
import {
  DatabaseEngine,
  ModelMerkleTree,
  ModelMetadataDatabase,
  ModelQueueTask,
  ModelRollupHistory,
  zkDatabaseConstant,
} from '@zkdb/storage';
import { PublicKey } from 'o1js';
// Time duration is equal 1/10 time on chain
const PADDING_TIME = TimeDuration.fromMinute(1);

export const SERVICE_ROLLUP = {
  clusterName: 'rollup-queue',
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
      'rollup-history',
      async () => {
        if (isRunning) {
          logger.debug('Task skipped to prevent overlap:', new Date());
          return;
        }

        isRunning = true;

        logger.info('Rollup service task started ', new Date());

        const minaNetwork = MinaNetwork.getInstance();

        minaNetwork.connect(
          config.NETWORK_ID,
          config.MINA_URL,
          config.BLOCKBERRY_API_KEY
        );

        const imQueue = ModelQueueTask.getInstance();

        // List all database that have publicKey and not empty
        const databaseList = await ModelMetadataDatabase.getInstance().list({
          appPublicKey: {
            $exists: true,
            $ne: '',
          },
          deployStatus: ETransactionStatus.Confirmed,
        });

        // Using fill/atSettled like to handle task concurrency
        await Fill(
          databaseList.map(
            ({ appPublicKey, databaseName, merkleHeight }) =>
              async () => {
                const zkAppPublicKey = PublicKey.fromBase58(appPublicKey);
                // Check if appPublicKey is valid
                if (zkAppPublicKey.isEmpty().toBoolean()) {
                  throw new Error('Invalid public key ');
                }

                // Get zkApp account from Mina network
                const { account, error } =
                  await minaNetwork.getAccount(zkAppPublicKey);

                if (!account || error) {
                  throw new Error(
                    `zk app with ${appPublicKey} is not exist in mina network. Error: ${error}`
                  );
                }

                const zkApp = account.zkapp;

                if (!zkApp) {
                  throw new Error('This account is not a zkApp');
                }

                // Get the merkle root
                const merkleRoot = zkApp.appState[0];

                // Initialize rollup number
                let rollupTaskNumber: number = 0;

                // Get task queue with databaseName and merkleRoot
                const taskQueue = await imQueue.findOne({
                  databaseName,
                  merkleRoot: merkleRoot.toString(),
                });

                if (
                  merkleRoot.equals(ModelMerkleTree.getEmptyRoot(merkleHeight))
                ) {
                  // Check empty root first
                  rollupTaskNumber = 0;
                } else if (taskQueue?.operationNumber) {
                  // Check taskQueue && taskQueue.operation existed

                  rollupTaskNumber = taskQueue.operationNumber;
                } else {
                  throw new Error('Cannot calculate rollup task number');
                }

                const pipeline = [
                  // Step 1: Match documents that have a specific 'databaseName'
                  {
                    $match: { databaseName },
                  },
                  // Step 2: Join this 'rollup' with 'transaction' & 'proof' collection
                  {
                    $lookup: {
                      from: zkDatabaseConstant.globalCollection.transaction,
                      localField: 'transactionObjectId',
                      foreignField: '_id',
                      as: 'transaction',
                    },
                  },
                  // {
                  //   $lookup: {
                  //     from: zkDatabaseConstant.globalCollection.proof,
                  //     localField: 'proofObjectId',
                  //     foreignField: '_id',
                  //     as: 'proof',
                  //   },
                  // },
                  // Step 3: Sort by latest
                  {
                    $sort: { createdAt: -1 },
                  },
                  { $limit: 1 },
                ];

                const imRollupHistory = ModelRollupHistory.getInstance();

                const listRollupHistoryDetail = await imRollupHistory.collection
                  .aggregate<TRollUpHistoryDetail>(pipeline)
                  .toArray();

                const latestRollUpHistory = listRollupHistoryDetail.at(0);

                if (!latestRollUpHistory) {
                  return;
                }

                logger.info(
                  `latest rollup history ${latestRollUpHistory.databaseName} found`
                );

                if (latestRollUpHistory) {
                  const latestTask = await imQueue.findOne(
                    {
                      databaseName,
                    },
                    { sort: { createdAt: -1 } }
                  );

                  if (!latestTask) {
                    throw new Error(
                      `Cannot find latest task with database ${databaseName}`
                    );
                  }

                  const rollUpDifferent =
                    latestTask.operationNumber - rollupTaskNumber;

                  let rollupState: ERollUpState = ERollUpState.Failed;

                  if (rollUpDifferent > 0) {
                    // Outdated case
                    rollupState = ERollUpState.Outdated;
                  } else if (
                    latestRollUpHistory.transaction.status ===
                    ETransactionStatus.Confirmed
                  ) {
                    rollupState = ERollUpState.Updated;
                  }

                  await imRollupHistory.updateOne(
                    {
                      databaseName,
                      proofObjectId: latestRollUpHistory.proof._id,
                      merkleTreeRoot: latestRollUpHistory.merkleTreeRoot,
                      transactionObjectId: latestRollUpHistory.transaction._id,
                      merkleTreeRootPrevious:
                        latestRollUpHistory.merkleTreeRootPrevious,
                    },
                    {
                      $set: {
                        updatedAt: new Date(),
                        rollUpStatus: rollupState,
                        rollUpDifferent: rollUpDifferent,
                        error: latestRollUpHistory.transaction.error,
                      },
                    }
                  );
                }

                /*
                    databaseName: string;
                     merkleTreeRoot: string;
                     merkleTreeRootPrevious: string;
                     transactionObjectId: ObjectId;
                     proofObjectId: ObjectId;
                     rollUpStatus: ERollUpState;
                     rollUpDifferent: number;
                     error: string;
                */
              }
          )
        );

        isRunning = false;
      },
      PADDING_TIME
    );

    queue.start();
  },
};

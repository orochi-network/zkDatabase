import { config, logger } from '@helper';
import { Fill, QueueLoop, TimeDuration } from '@orochi-network/queue';
import { MinaNetwork } from '@zkdb/smart-contract';
import {
  DatabaseEngine,
  ModelMetadataDatabase,
  ModelQueueTask,
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

        logger.info('Transaction service task started ', new Date());

        const minaNetwork = MinaNetwork.getInstance();
        const imQueue = ModelQueueTask.getInstance();
        // List all database that have publicKey and not empty
        const databaseList = await ModelMetadataDatabase.getInstance().list({
          appPublicKey: { $exists: true, $ne: '' },
        });
        // Using fill/atSettled like to handle task concurrency
        await Fill(
          databaseList.map(({ appPublicKey, databaseName }) => async () => {
            const zkAppPublicKey = PublicKey.fromBase58(appPublicKey);
            // Check if appPublicKey is valid
            if (zkAppPublicKey.isEmpty().toBoolean()) {
              throw new Error('Invalid public key');
            }

            // Get zkApp account from Mina network
            const { account, error } =
              await minaNetwork.getAccount(zkAppPublicKey);

            if (!account) {
              throw new Error(
                `zk app with ${appPublicKey} is not exist in mina network. Error: ${error}`
              );
            }

            const zkApp = account.zkapp;

            if (!zkApp) {
              throw new Error(`This account is not a zkApp`);
            }

            // Get the merkle root
            const merkleRoot = zkApp.appState.at(0);

            // Initalize rollup number
            let rollupNumber: number = 0;

            // Get task queue with databaseName and merkleRoot
            const taskQueue = await imQueue.findOne({
              databaseName,
              merkleRoot,
            });

            if ()
          })
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

        const task = await imQueue.findOne({
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

        const pipeline = [
          {
            $match: { databaseName },
          },
          {
            $lookup: {
              from: zkDatabaseConstant.globalCollection.transaction,
              localField: 'transactionObjectId',
              foreignField: '_id',
              as: 'transaction',
            },
          },
          {
            $lookup: {
              from: zkDatabaseConstant.globalCollection.proof,
              localField: 'proofObjectId',
              foreignField: '_id',
              as: 'proof',
            },
          },
          {
            $sort: { createdAt: -1 },
          },
          {
            $project: {
              transactionObjectId: 0,
              proofObjectId: 0,
            },
          },
        ];

        const listRollupHistoryDetail = (await imRollupHistory.collection
          .aggregate(pipeline)
          .toArray()) as TRollUpHistoryDetail[];

        const latestTask = await imQueue.findOne(
          {
            database: databaseName,
          },
          { sort: { createdAt: -1 } }
        );

        if (!latestTask) {
          throw new Error('Latest task not found');
        }

        const diff = latestTask.operationNumber - rolledUpTaskNumber;

        let rollUpState: ERollUpState = ERollUpState.Failed;

        // @NOTICE transaction status must be updated in cron job.
        if (diff > 0) {
          rollUpState = ERollUpState.Outdated;
        } else if (
          listRollupHistoryDetail[0].transaction.status ===
          ETransactionStatus.Confirmed
        ) {
          rollUpState = ERollUpState.Updated;
        }

        //   return {
        //     history: listRollupHistoryDetail,
        //     state: rollUpState,
        //     rollUpDifferent: diff,
        //   };

        isRunning = false;
      },
      PADDING_TIME
    );

    queue.start();
  },
};

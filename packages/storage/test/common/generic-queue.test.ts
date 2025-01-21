// TODO: Maybe also test for sequential correctness

import { EQueueTaskStatus } from '@zkdb/common';
import {
  DatabaseEngine,
  EQueueType,
  ModelGenericQueue,
  Transaction,
  zkDatabaseConstant,
  config,
} from '../../src';

const COLLECTION_NAME = '__test_run_db__generic-queue';

describe('generic-queue', () => {
  let minaDb: DatabaseEngine;
  let serverlessDb: DatabaseEngine;

  beforeAll(async () => {
    minaDb = DatabaseEngine.getInstance(config.PROOF_MONGODB_URL);
    serverlessDb = DatabaseEngine.getInstance(config.MONGODB_URL);
    if (!minaDb.isConnected()) {
      await minaDb.connect();
      await serverlessDb.connect();
    }
    await minaDb.client
      .db(zkDatabaseConstant.globalMinaDatabase)
      .collection(COLLECTION_NAME)
      .drop();
  });

  afterAll(async () => {
    await minaDb.disconnect();
    await serverlessDb.disconnect();
  });

  beforeEach(async () => {});

  afterEach(async () => {
    await minaDb.client
      .db(zkDatabaseConstant.globalMinaDatabase)
      .collection(COLLECTION_NAME)
      .drop();
  });

  test('multiple workers concurrently poll and process task from queue', async () => {
    type QueueData = {
      something: number;
    };

    const imModelQueue = await Transaction.mina(async (session) => {
      return ModelGenericQueue.unsafeGetInstance<QueueData>(
        EQueueType.DocumentQueue,
        COLLECTION_NAME,
        session
      );
    });

    const randomDigit = Math.floor(Math.random() * 100);

    for (let i = 0; i < 100; i++) {
      await imModelQueue.queueTask({
        data: { something: i },
        databaseName: `test${randomDigit}`,
        sequenceNumber: BigInt(i),
      });
    }

    async function worker() {
      while (true) {
        const task = await imModelQueue.acquireNextTaskInQueue(async () => {
          return true;
        });

        if (task === null) {
          break;
        }
      }
    }

    await Promise.all([worker(), worker()]);

    const count = await imModelQueue.count();
    const processedTaskCount = await imModelQueue.count({
      status: EQueueTaskStatus.Success,
    });

    expect(count).toEqual(processedTaskCount);
  });
});

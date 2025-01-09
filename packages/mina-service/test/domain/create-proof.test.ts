import {
  DatabaseEngine,
  ModelDbSetting,
  ModelMerkleTree,
  ModelRollupOffChain,
  ModelQueueTask,
  TaskEntity,
} from '@zkdb/storage';
import { Field, Poseidon } from 'o1js';
import { config } from '../../src/helper/config.js';

const DB_NAME = 'test-db-document';
const TEST_COLLECTION = 'test-collection';
const MERKLE_HEIGHT = 12;

describe('create proof', () => {
  let dbEngine: DatabaseEngine;

  beforeAll(async () => {
    dbEngine = DatabaseEngine.getInstance(config.MONGODB_URL);
    if (!dbEngine.isConnected()) {
      await dbEngine.connect();
    }
  });

  afterAll(async () => {
    await dbEngine.disconnect();
  });

  async function dropDatabases() {
    const adminDb = dbEngine.client.db().admin();

    // List all databases
    const { databases } = await adminDb.listDatabases();

    // Filter out system databases
    const userDatabases = databases.filter(
      (dbInfo) => !['admin', 'local', 'config'].includes(dbInfo.name)
    );

    // Drop each user database
    await Promise.all(
      userDatabases.map(async (dbInfo) => {
        const db = dbEngine.client.db(dbInfo.name);
        await db.dropDatabase();
      })
    );
  }

  beforeEach(async () => {
    await dropDatabases();
  });

  afterEach(async () => {
    await dropDatabases();
  });
});

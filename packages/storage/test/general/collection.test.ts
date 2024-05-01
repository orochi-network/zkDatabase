import { DatabaseEngine, ModelCollection } from '../../src';
import config from '../../src/helper/config';

describe('ModelCollection', () => {
  let dbEngine: DatabaseEngine;

  beforeAll(async () => {
    dbEngine = DatabaseEngine.getInstance(config.mongodbUrl);
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

  describe('Indexes', () => {
    test('succeed in setting and retrieving indexes', async () => {
      const DB_NAME = 'test_db';
      const COLLECTION_NAME = 'test_collection';

      const modelCollection = ModelCollection.getInstance(
        DB_NAME,
        COLLECTION_NAME
      );

      await modelCollection.index(['name', 'age']);

      const indexes = await modelCollection.listIndexes();

      expect(indexes).toContain('name');
      expect(indexes).toContain('age');
    });
  });
});

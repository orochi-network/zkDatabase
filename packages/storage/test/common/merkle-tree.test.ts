import { Field, MerkleTree } from 'o1js';
import { DatabaseEngine, ModelMerkleTree } from '../../build/src';
import { config } from '../../src/helper/config';

const DB_NAME = 'test-db-document';
const MERKLE_HEIGHT = 12;

describe('ModelMerkleTree', () => {
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

  test('should correctly set leaf nodes and match root with in-memory MerkleTree', async () => {
    const modelMerkleTree = await ModelMerkleTree.load(DB_NAME);

    const merkleTree = new MerkleTree(MERKLE_HEIGHT);

    for (let i = 0; i < 1000; i++) {
      const index = BigInt(i);
      const value = Field(i + 1);
      merkleTree.setLeaf(index, value);
      await modelMerkleTree.setLeaf(index, value, new Date());

      const root = await modelMerkleTree.getRoot(new Date());

      expect(root).toEqual(merkleTree.getRoot());
    }
  });

  test('should correctly retrieve Merkle witnesses for leaf nodes', async () => {
    const modelMerkleTree = await ModelMerkleTree.load(DB_NAME);

    const merkleTree = new MerkleTree(MERKLE_HEIGHT);

    for (let i = 0; i < 1000; i++) {
      const index = BigInt(i);
      const value = Field(i + 1);
      merkleTree.setLeaf(index, value);
      await modelMerkleTree.setLeaf(index, value, new Date());

      const witness = await modelMerkleTree.getWitness(index, new Date());

      expect(witness).toEqual(merkleTree.getWitness(index));
    }
  });
});

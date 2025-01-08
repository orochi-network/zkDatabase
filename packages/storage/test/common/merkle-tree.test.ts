import { Field, MerkleTree } from 'o1js';
import {
  DatabaseEngine,
  ModelMerkleTree,
  ModelMetadataDatabase,
} from '../../build/src';
import { config } from '../../build/src';
import { ETransactionStatus } from '@zkdb/common';

const DB_NAME = '__test_run_db__merkle-tree';
const MERKLE_HEIGHT = 12;

describe('ModelMerkleTree', () => {
  let dbEngine: DatabaseEngine;

  beforeAll(async () => {
    dbEngine = DatabaseEngine.getInstance(config.MONGODB_URL);
    if (!dbEngine.isConnected()) {
      await dbEngine.connect();
    }

    await new ModelMetadataDatabase().deleteOne({ databaseName: DB_NAME });
    await dbEngine.client.db(DB_NAME).dropDatabase();
  });

  afterAll(async () => {
    await dbEngine.disconnect();
  });

  beforeEach(async () => {
    await new ModelMetadataDatabase().insertOne({
      databaseName: DB_NAME,
      merkleHeight: MERKLE_HEIGHT,
      databaseOwner: 'test',
      appPublicKey: '',
      createdAt: new Date(),
      updatedAt: new Date(),
      deployStatus: ETransactionStatus.Unknown,
    });
  });

  afterEach(async () => {
    await new ModelMetadataDatabase().deleteOne({ databaseName: DB_NAME });
    await dbEngine.client.db(DB_NAME).dropDatabase();
  });

  test('should correctly set leaf nodes and match root with in-memory MerkleTree', async () => {
    const modelMerkleTree = await ModelMerkleTree.getInstance(DB_NAME);

    const merkleTree = new MerkleTree(MERKLE_HEIGHT);

    for (let i = 0; i < 1000; i++) {
      const index = BigInt(i);
      const value = Field(i + 1);
      merkleTree.setLeaf(index, value);
      await modelMerkleTree.setLeaf(
        index,
        value,
        dbEngine.client.startSession()
      );

      const root = await modelMerkleTree.getRoot();

      expect(root).toEqual(merkleTree.getRoot());
    }
  });

  test('should correctly retrieve Merkle witnesses for leaf nodes', async () => {
    const modelMerkleTree = await ModelMerkleTree.getInstance(DB_NAME);

    const merkleTree = new MerkleTree(MERKLE_HEIGHT);

    for (let i = 0; i < 1000; i++) {
      const index = BigInt(i);
      const value = Field(i + 1);
      merkleTree.setLeaf(index, value);
      await modelMerkleTree.setLeaf(
        index,
        value,
        dbEngine.client.startSession()
      );

      const witness = await modelMerkleTree.getMerkleProof(index);

      expect(witness).toEqual(merkleTree.getWitness(index));
    }
  });

  test('merkle tree utilities correctness', async () => {
    const modelMerkleTree = await ModelMerkleTree.getInstance(DB_NAME);

    const merkleTree = new MerkleTree(MERKLE_HEIGHT);

    for (let i = 0; i < 100; i++) {
      const index = BigInt(i);
      const value = Field(i + 1);
      merkleTree.setLeaf(index, value);
      await modelMerkleTree.setLeaf(
        index,
        value,
        dbEngine.client.startSession()
      );

      expect(await modelMerkleTree.countNodeByLevel(0)).toEqual(i + 1);
      expect(await modelMerkleTree.getListNodeByLevel(0)).toEqual(
        Array.from({ length: i + 1 }, (_, j) => ({
          hash: Field(j + 1).toString(),
          level: 0,
          index: j,
          isLeaf: true,
        }))
      );
    }

    expect(await modelMerkleTree.countNodeByLevel(1)).toEqual(50);
    expect(modelMerkleTree.height).toEqual(12);
    expect(await modelMerkleTree.getNode(0, 12n)).toEqual(Field(13));
    expect(modelMerkleTree.leafCount).toEqual(2048n);
    expect(await modelMerkleTree.getNode(1, 1n)).toEqual(
      merkleTree.getNode(1, 1n)
    );
    expect(await modelMerkleTree.getNode(10, 1024n)).toEqual(
      merkleTree.getNode(10, 1024n)
    );
    expect(await modelMerkleTree.getRoot()).toEqual(merkleTree.getRoot());
    expect(await modelMerkleTree.getMerkleProof(55n)).toEqual(
      merkleTree.getWitness(55n)
    );
  });
});

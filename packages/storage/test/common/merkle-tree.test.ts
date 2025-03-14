import { Field, MerkleTree } from 'o1js';
import {
  DatabaseEngine,
  ModelMerkleTree,
  ModelMetadataDatabase,
  Transaction,
  zkDatabaseConstant,
  config,
} from '../../src';
import { ETransactionStatus } from '@zkdb/common';

const DB_NAME = '__test_run_db__merkle-tree';
const MERKLE_HEIGHT = 12;

describe('ModelMerkleTree', () => {
  let minaDb: DatabaseEngine;
  let serverlessDb: DatabaseEngine;

  beforeAll(async () => {
    minaDb = DatabaseEngine.getInstance(config.PROOF_MONGODB_URL);
    serverlessDb = DatabaseEngine.getInstance(config.MONGODB_URL);
    if (!minaDb.isConnected()) {
      await minaDb.connect();
      await serverlessDb.connect();
    }

    await new ModelMetadataDatabase().deleteOne({ databaseName: DB_NAME });
  });

  afterAll(async () => {
    await new ModelMetadataDatabase().deleteOne({ databaseName: DB_NAME });
    await minaDb.disconnect();
    await serverlessDb.disconnect();
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
    await minaDb.client
      .db(zkDatabaseConstant.globalMerkleTreeDatabase)
      .collection(DB_NAME)
      .drop();
  });

  afterEach(async () => {
    await minaDb.client
      .db(zkDatabaseConstant.globalMerkleTreeDatabase)
      .collection(DB_NAME)
      .drop();
    ModelMerkleTree.clearInstance(DB_NAME);
    await new ModelMetadataDatabase().deleteOne({ databaseName: DB_NAME });
  });

  test('should correctly set leaf nodes and match root with in-memory MerkleTree', async () => {
    const modelMerkleTree = await Transaction.mina(async (session) => {
      return ModelMerkleTree.getInstance(DB_NAME, session);
    });

    const merkleTree = new MerkleTree(MERKLE_HEIGHT);

    for (let i = 0; i < 100; i++) {
      const index = BigInt(i);
      const value = Field(i + 1);
      merkleTree.setLeaf(index, value);
      await Transaction.mina(async (session) => {
        await modelMerkleTree.setLeaf(index, value, session);
      });

      const root = await modelMerkleTree.getRoot();

      expect(root).toEqual(merkleTree.getRoot().toString());
    }
  });

  test('should correctly retrieve Merkle witnesses for leaf nodes', async () => {
    const modelMerkleTree = await Transaction.mina(async (session) => {
      return ModelMerkleTree.getInstance(DB_NAME, session);
    });

    const merkleTree = new MerkleTree(MERKLE_HEIGHT);

    for (let i = 0; i < 100; i++) {
      const index = BigInt(i);
      const value = Field(i + 1);
      merkleTree.setLeaf(index, value);
      await Transaction.mina(async (session) => {
        await modelMerkleTree.setLeaf(index, value, session);
      });

      const witness = (await modelMerkleTree.getMerkleProof(index)).map(
        (w) => ({
          ...w,
          sibling: Field(w.sibling),
        })
      );

      expect(witness).toEqual(merkleTree.getWitness(index));
    }
  });

  test('merkle tree utilities correctness', async () => {
    const merkleTree = new MerkleTree(MERKLE_HEIGHT);

    const modelMerkleTree = await Transaction.mina(async (session) => {
      return ModelMerkleTree.getInstance(DB_NAME, session);
    });

    for (let i = 0; i < 100; i++) {
      const index = BigInt(i);
      const value = Field(i + 1);
      merkleTree.setLeaf(index, value);
      await Transaction.mina(async (session) => {
        await modelMerkleTree.setLeaf(index, value, session);
      });

      expect(await modelMerkleTree.countNodeByLevel(0)).toEqual(i + 1);
      expect(
        await modelMerkleTree.getListNodeByLevel(0, {
          limit: Infinity,
          offset: 0,
        })
      ).toEqual(
        Array.from({ length: i + 1 }, (_, j) => ({
          hash: Field(j + 1).toString(),
          level: 0,
          index: j,
        }))
      );
    }

    expect(await modelMerkleTree.countNodeByLevel(1)).toEqual(50);
    expect(modelMerkleTree.height).toEqual(12);
    expect(await modelMerkleTree.getNode(0, 12n)).toEqual(Field(13).toString());
    expect(modelMerkleTree.leafCount).toEqual(2048n);
    expect(await modelMerkleTree.getNode(1, 1n)).toEqual(
      merkleTree.getNode(1, 1n).toString()
    );
    expect(await modelMerkleTree.getNode(10, 1024n)).toEqual(
      merkleTree.getNode(10, 1024n).toString()
    );
    expect(await modelMerkleTree.getRoot()).toEqual(
      merkleTree.getRoot().toString()
    );
    expect(
      (await modelMerkleTree.getMerkleProof(55n)).map((w) => ({
        ...w,
        sibling: Field(w.sibling),
      }))
    ).toEqual(merkleTree.getWitness(55n));
  });
});

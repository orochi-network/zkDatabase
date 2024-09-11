/* eslint-disable max-classes-per-file */
import { DatabaseEngine } from '@zkdb/storage';
import { Field, MerkleTree, PrivateKey, PublicKey } from 'o1js';
import {
  createDocument,
  deleteDocument,
  readDocument,
  updateDocument,
} from '../../../src/domain/use-case/document.js';
import { createCollection } from '../../../src/domain/use-case/collection.js';
import { createDatabase } from '../../../src/domain/use-case/database.js';
import { config } from '../../../src/helper/config.js';
import { Schema } from '../../../src/domain/common/schema.js';

const DB_NAME = 'test-db';
const TEST_COLLECTION = 'users';
const MERKLE_HEIGHT = 8;
const PUBLIC_KEY = PublicKey.fromPrivateKey(PrivateKey.random()).toBase58();

const dropDatabase = true;

describe('Document Management Integration Tests', () => {
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
    if (!dropDatabase) {
      return;
    }
    const adminDb = dbEngine.client.db().admin();
    const { databases } = await adminDb.listDatabases();
    const userDatabases = databases.filter(
      (dbInfo) => !['admin', 'local', 'config'].includes(dbInfo.name)
    );
    await Promise.all(
      userDatabases.map(async (dbInfo) => {
        const db = dbEngine.client.db(dbInfo.name);
        await db.dropDatabase();
      })
    );
  }

  beforeEach(async () => {
    await dropDatabases();
    await createDatabase(DB_NAME, MERKLE_HEIGHT, "", PUBLIC_KEY);
  });

  afterEach(async () => {
    await dropDatabases();
  });

  describe('Document Create', () => {
    test('fails without create permissions', async () => {
      const COLLECTION_OWNER = 'IAM';
      const COLLECTION_GROUP = 'users';

      await createCollection(
        DB_NAME,
        TEST_COLLECTION,
        COLLECTION_OWNER,
        COLLECTION_GROUP,
        [
          {
            name: 'name',
            kind: 'CircuitString',
            indexed: true,
          },
        ],
        {
          permissionOwner: { read: true },
        }
      );

      await expect(async () => {
        await createDocument(
          DB_NAME,
          TEST_COLLECTION,
          COLLECTION_OWNER,
          [
            {
              name: 'name',
              kind: 'CircuitString',
              value: 'John',
            },
          ],
          {
            permissionOwner: { read: true },
          }
        );
      }).rejects.toThrow();
    });

    test('succeeds with create permission and returns a Merkle witness', async () => {
      const COLLECTION_OWNER = 'IAM';
      const COLLECTION_GROUP = 'users';

      const merkleTree = new MerkleTree(MERKLE_HEIGHT);

      class User extends Schema.create({ name: Field }, ['name']) {}

      await createCollection(
        DB_NAME,
        TEST_COLLECTION,
        COLLECTION_OWNER,
        COLLECTION_GROUP,
        User.getSchema(),
        {
          permissionOwner: { create: true, read: true },
        }
      );

      const john = new User({ name: Field(12) });

      merkleTree.setLeaf(1n, john.hash());

      const witness = await createDocument(
        DB_NAME,
        TEST_COLLECTION,
        COLLECTION_OWNER,
        john.serialize(),
        {
          permissionOwner: { read: true },
        }
      );

      expect(witness).toBeDefined();
      expect(witness).toEqual(merkleTree.getWitness(1n));
    });
  });

  describe('Document Read', () => {
    test('fails as the read permission for collection is missed', async () => {
      const COLLECTION_OWNER = 'IAM';
      const COLLECTION_GROUP = 'users';

      class User extends Schema.create({ name: Field }, ['name']) {}
      await createCollection(
        DB_NAME,
        TEST_COLLECTION,
        COLLECTION_OWNER,
        COLLECTION_GROUP,
        User.getSchema(),
        {
          permissionOwner: { create: true, read: false },
        }
      );

      const john = new User({ name: Field(12) });
      await createDocument(
        DB_NAME,
        TEST_COLLECTION,
        COLLECTION_OWNER,
        john.serialize(),
        {
          permissionOwner: { read: true },
        }
      );

      await expect(async () =>
        readDocument(DB_NAME, TEST_COLLECTION, COLLECTION_OWNER, { name: '12' })
      ).rejects.toBeDefined();
    });
    test('fails as the read permission for document is missed', async () => {
      const COLLECTION_OWNER = 'IAM';
      const COLLECTION_GROUP = 'users';

      class User extends Schema.create({ name: Field }, ['name']) {}
      await createCollection(
        DB_NAME,
        TEST_COLLECTION,
        COLLECTION_OWNER,
        COLLECTION_GROUP,
        User.getSchema(),
        {
          permissionOwner: { create: true, read: true },
        }
      );

      const john = new User({ name: Field(12) });
      await createDocument(
        DB_NAME,
        TEST_COLLECTION,
        COLLECTION_OWNER,
        john.serialize(),
        {
          permissionOwner: { read: false },
        }
      );

      await expect(async () =>
        readDocument(DB_NAME, TEST_COLLECTION, COLLECTION_OWNER, { name: '12' })
      ).rejects.toBeDefined();
    });

    test('retrieves the correct document by name', async () => {
      const COLLECTION_OWNER = 'IAM';
      const COLLECTION_GROUP = 'users';

      class User extends Schema.create({ name: Field }, ['name']) {}
      await createCollection(
        DB_NAME,
        TEST_COLLECTION,
        COLLECTION_OWNER,
        COLLECTION_GROUP,
        User.getSchema(),
        {
          permissionOwner: { create: true, read: true },
        }
      );

      const john = new User({ name: Field(12) });
      await createDocument(
        DB_NAME,
        TEST_COLLECTION,
        COLLECTION_OWNER,
        john.serialize(),
        {
          permissionOwner: { read: true },
        }
      );

      const retrievedDocument = await readDocument(
        DB_NAME,
        TEST_COLLECTION,
        COLLECTION_OWNER,
        { name: '12' }
      );

      expect(retrievedDocument).toBeDefined();

      // const { _id, ...pureDocument } = retrievedDocument!;

      // const deserializedUser = User.deserialize(
      //   Object.values(pureDocument) as SchemaEncoded
      // );

      // expect(deserializedUser).toEqual(john);
    });

    test('returns null for a non-existent document', async () => {
      const COLLECTION_OWNER = 'IAM';
      const COLLECTION_GROUP = 'users';

      class User extends Schema.create({ name: Field }, ['name']) {}
      await createCollection(
        DB_NAME,
        TEST_COLLECTION,
        COLLECTION_OWNER,
        COLLECTION_GROUP,
        User.getSchema(),
        {
          permissionOwner: { create: true, read: true },
        }
      );

      const john = new User({ name: Field(12) });
      await createDocument(
        DB_NAME,
        TEST_COLLECTION,
        COLLECTION_OWNER,
        john.serialize(),
        {
          permissionOwner: { read: true },
        }
      );

      const nonExistentDocument = await readDocument(
        DB_NAME,
        TEST_COLLECTION,
        COLLECTION_OWNER,
        { name: '4' }
      );

      expect(nonExistentDocument).toBeNull();
    });
  });

  describe('Document Update', () => {
    test('fails without update permission for collection', async () => {
      const COLLECTION_OWNER = 'IAM';
      const COLLECTION_GROUP = 'users';

      class User extends Schema.create({ name: Field }, ['name']) {}
      await createCollection(
        DB_NAME,
        TEST_COLLECTION,
        COLLECTION_OWNER,
        COLLECTION_GROUP,
        User.getSchema(),
        {
          permissionOwner: { create: true, read: false },
        }
      );

      const john = new User({ name: Field(12) });
      const newJohn = new User({ name: Field(14) });

      await createDocument(
        DB_NAME,
        TEST_COLLECTION,
        COLLECTION_OWNER,
        john.serialize(),
        {
          permissionOwner: { write: true },
        }
      );

      await expect(async () =>
        updateDocument(
          DB_NAME,
          TEST_COLLECTION,
          COLLECTION_OWNER,
          { name: '12' },
          newJohn.serialize()
        )
      ).rejects.toBeDefined();
    });

    test('fails without update permission for document', async () => {
      const COLLECTION_OWNER = 'IAM';
      const COLLECTION_GROUP = 'users';

      class User extends Schema.create({ name: Field }, ['name']) {}
      await createCollection(
        DB_NAME,
        TEST_COLLECTION,
        COLLECTION_OWNER,
        COLLECTION_GROUP,
        User.getSchema(),
        {
          permissionOwner: { create: true, read: false, write: true },
        }
      );

      const john = new User({ name: Field(12) });
      const newJohn = new User({ name: Field(14) });

      await createDocument(
        DB_NAME,
        TEST_COLLECTION,
        COLLECTION_OWNER,
        john.serialize(),
        {
          permissionOwner: { write: false },
        }
      );

      await expect(async () =>
        updateDocument(
          DB_NAME,
          TEST_COLLECTION,
          COLLECTION_OWNER,
          { name: '12' },
          newJohn.serialize()
        )
      ).rejects.toBeDefined();
    });

    test('successfully update document', async () => {
      const COLLECTION_OWNER = 'IAM';
      const COLLECTION_GROUP = 'users';

      const merkleTree = new MerkleTree(MERKLE_HEIGHT);

      class User extends Schema.create({ name: Field }, ['name']) {}

      await createCollection(
        DB_NAME,
        TEST_COLLECTION,
        COLLECTION_OWNER,
        COLLECTION_GROUP,
        User.getSchema(),
        {
          permissionOwner: { create: true, read: true, write: true },
        }
      );

      const john = new User({ name: Field(12) });

      merkleTree.setLeaf(1n, john.hash());

      const witness = await createDocument(
        DB_NAME,
        TEST_COLLECTION,
        COLLECTION_OWNER,
        john.serialize(),
        {
          permissionOwner: { read: true, write: true },
        }
      );

      expect(witness).toBeDefined();
      expect(witness).toEqual(merkleTree.getWitness(1n));

      const newJohn = new User({ name: Field(14) });

      merkleTree.setLeaf(1n, newJohn.hash());

      const newWitness = await updateDocument(
        DB_NAME,
        TEST_COLLECTION,
        COLLECTION_OWNER,
        { name: 12 },
        john.serialize()
      );

      const updatedDocument = await readDocument(
        DB_NAME,
        TEST_COLLECTION,
        COLLECTION_OWNER,
        { name: 14 }
      );

      expect(updatedDocument).toBeDefined();
      expect(newWitness).toBeDefined();
      expect(newWitness).toEqual(merkleTree.getWitness(1n));
    });

    test('fails as document does not exist', async () => {
      const COLLECTION_OWNER = 'IAM';
      const COLLECTION_GROUP = 'users';

      const merkleTree = new MerkleTree(MERKLE_HEIGHT);

      class User extends Schema.create({ name: Field }, ['name']) {}

      await createCollection(
        DB_NAME,
        TEST_COLLECTION,
        COLLECTION_OWNER,
        COLLECTION_GROUP,
        User.getSchema(),
        {
          permissionOwner: { create: true, read: true },
        }
      );

      const newJohn = new User({ name: Field(14) });

      merkleTree.setLeaf(1n, newJohn.hash());

      await expect(async () =>
        updateDocument(
          DB_NAME,
          TEST_COLLECTION,
          COLLECTION_OWNER,
          {
            name: 16,
          },
          newJohn.serialize()
        )
      ).rejects.toBeDefined();
    });
  });
  describe('Document Delete', () => {
    test('fails without delete permission for collection', async () => {
      const COLLECTION_OWNER = 'IAM';
      const COLLECTION_GROUP = 'users';

      class User extends Schema.create({ name: Field }, ['name']) {}
      await createCollection(
        DB_NAME,
        TEST_COLLECTION,
        COLLECTION_OWNER,
        COLLECTION_GROUP,
        User.getSchema(),
        {
          permissionOwner: { create: true, delete: false },
        }
      );

      const john = new User({ name: Field(12) });

      await createDocument(
        DB_NAME,
        TEST_COLLECTION,
        COLLECTION_OWNER,
        john.serialize(),
        {
          permissionOwner: { write: true, delete: false },
        }
      );

      await expect(async () =>
        deleteDocument(DB_NAME, TEST_COLLECTION, COLLECTION_OWNER, {
          name: '12',
        })
      ).rejects.toBeDefined();
    });

    test('fails without delete permission for document', async () => {
      const COLLECTION_OWNER = 'IAM';
      const COLLECTION_GROUP = 'users';

      class User extends Schema.create({ name: Field }, ['name']) {}
      await createCollection(
        DB_NAME,
        TEST_COLLECTION,
        COLLECTION_OWNER,
        COLLECTION_GROUP,
        User.getSchema(),
        {
          permissionOwner: { create: true, delete: true },
        }
      );

      const john = new User({ name: Field(12) });

      await createDocument(
        DB_NAME,
        TEST_COLLECTION,
        COLLECTION_OWNER,
        john.serialize(),
        {
          permissionOwner: { write: true, delete: false },
        }
      );

      await expect(async () =>
        deleteDocument(DB_NAME, TEST_COLLECTION, COLLECTION_OWNER, {
          name: '12',
        })
      ).rejects.toBeDefined();
    });

    test('successfully delete document', async () => {
      const COLLECTION_OWNER = 'IAM';
      const COLLECTION_GROUP = 'users';

      const merkleTree = new MerkleTree(MERKLE_HEIGHT);

      class User extends Schema.create({ name: Field }, ['name']) {}
      await createCollection(
        DB_NAME,
        TEST_COLLECTION,
        COLLECTION_OWNER,
        COLLECTION_GROUP,
        User.getSchema(),
        {
          permissionOwner: { create: true, delete: true, read: true },
        }
      );

      const john = new User({ name: Field(12) });

      await createDocument(
        DB_NAME,
        TEST_COLLECTION,
        COLLECTION_OWNER,
        john.serialize(),
        {
          permissionOwner: { write: true, delete: true, read: true },
        }
      );

      merkleTree.setLeaf(1n, Field(0));

      const witness = await deleteDocument(
        DB_NAME,
        TEST_COLLECTION,
        COLLECTION_OWNER,
        {
          name: '12',
        }
      );

      const deletedDocument = await readDocument(
        DB_NAME,
        TEST_COLLECTION,
        COLLECTION_OWNER,
        { name: '12' }
      );

      expect(deletedDocument).toBeNull();
      expect(witness).toEqual(merkleTree.getWitness(1n));
    });

    test('fails as document does not exist', async () => {
      const COLLECTION_OWNER = 'IAM';
      const COLLECTION_GROUP = 'users';

      class User extends Schema.create({ name: Field }, ['name']) {}
      await createCollection(
        DB_NAME,
        TEST_COLLECTION,
        COLLECTION_OWNER,
        COLLECTION_GROUP,
        User.getSchema(),
        {
          permissionOwner: { create: true, delete: true },
        }
      );

      const john = new User({ name: Field(12) });

      await createDocument(
        DB_NAME,
        TEST_COLLECTION,
        COLLECTION_OWNER,
        john.serialize(),
        {
          permissionOwner: { write: true, delete: true },
        }
      );

      await expect(async () =>
        deleteDocument(DB_NAME, TEST_COLLECTION, COLLECTION_OWNER, {
          name: '15',
        })
      ).rejects.toBeDefined();
    });
  });
});

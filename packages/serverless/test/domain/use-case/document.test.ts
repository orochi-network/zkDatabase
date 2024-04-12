/* eslint-disable max-classes-per-file */
import { DatabaseEngine } from '@zkdb/storage';
import { Field } from 'o1js';
import { createDocument, readDocument } from '../../../src/domain/use-case/document';
import { createCollection } from '../../../src/domain/use-case/collection';
import { createDatabase } from '../../../src/domain/use-case/database';
import config from '../../../src/helper/config';
import { Schema, SchemaEncoded } from '../../../src/domain/common/schema';

const DB_NAME = 'test-db';
const TEST_COLLECTION = 'users';
const MERKLE_HEIGHT = 8;

describe('Document Management Integration Tests', () => {
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
    const { databases } = await adminDb.listDatabases();
    const userDatabases = databases.filter(dbInfo => !['admin', 'local', 'config'].includes(dbInfo.name));
    await Promise.all(userDatabases.map(async dbInfo => {
      const db = dbEngine.client.db(dbInfo.name);
      await db.dropDatabase();
    }));
  }

  beforeEach(async () => {
    await dropDatabases();
    await createDatabase(DB_NAME, MERKLE_HEIGHT);
  });

  afterEach(async () => {
    await dropDatabases();
  });

  describe('Document Creation', () => {
    test('fails without create permissions', async () => {
      const COLLECTION_OWNER = 'IAM';
      const COLLECTION_GROUP = 'users';

      await createCollection(DB_NAME, TEST_COLLECTION, COLLECTION_OWNER, COLLECTION_GROUP, [{
        name: 'name',
        kind: 'CircuitString',
        indexed: true,
      }], {
        permissionOwner: { read: true }
      });

      await expect(async () => {
        await createDocument(DB_NAME, TEST_COLLECTION, COLLECTION_OWNER, [{
          name: 'name',
          kind: 'CircuitString',
          value: 'John',
        }], {
          permissionOwner: { read: true }
        });
      }).rejects.toThrow();
    });

    test('succeeds with create permission and returns a Merkle witness', async () => {
      const COLLECTION_OWNER = 'IAM';
      const COLLECTION_GROUP = 'users';

      class User extends Schema.create({ name: Field }, ['name']) {}

      await createCollection(DB_NAME, TEST_COLLECTION, COLLECTION_OWNER, COLLECTION_GROUP, User.getSchema(), {
        permissionOwner: { create: true, read: true }
      });

      const john = new User({ name: Field(12) });
      const witness = await createDocument(DB_NAME, TEST_COLLECTION, COLLECTION_OWNER, john.serialize(), {
        permissionOwner: { read: true }
      });

      expect(witness).toBeDefined();
    });
  });

  describe('Document Reading', () => {
    test('retrieves the correct document by name', async () => {
      const COLLECTION_OWNER = 'IAM';
      const COLLECTION_GROUP = 'users';

      class User extends Schema.create({ name: Field }, ['name']) {}
      await createCollection(DB_NAME, TEST_COLLECTION, COLLECTION_OWNER, COLLECTION_GROUP, User.getSchema(), {
        permissionOwner: { create: true, read: true }
      });

      const john = new User({ name: Field(12) });
      await createDocument(DB_NAME, TEST_COLLECTION, COLLECTION_OWNER, john.serialize(), {
        permissionOwner: { read: true }
      });

      const retrievedDocument = await readDocument(DB_NAME, TEST_COLLECTION, COLLECTION_OWNER, { name: '12' });
      const deserializedUser = User.deserialize(retrievedDocument as SchemaEncoded);

      expect(deserializedUser).toEqual(john);
    });

    test('returns null for a non-existent document', async () => {
      const COLLECTION_OWNER = 'IAM';
      const COLLECTION_GROUP = 'users';

      class User extends Schema.create({ name: Field }, ['name']) {}
      await createCollection(DB_NAME, TEST_COLLECTION, COLLECTION_OWNER, COLLECTION_GROUP, User.getSchema(), {
        permissionOwner: { create: true, read: true }
      });

      const john = new User({ name: Field(12) });
      await createDocument(DB_NAME, TEST_COLLECTION, COLLECTION_OWNER, john.serialize(), {
        permissionOwner: { read: true }
      });

      const nonExistentDocument = await readDocument(DB_NAME, TEST_COLLECTION, COLLECTION_OWNER, { name: '4' });

      expect(nonExistentDocument).toBeNull();
    });
  });
});

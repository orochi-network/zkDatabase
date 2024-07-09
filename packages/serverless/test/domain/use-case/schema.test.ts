import { DatabaseEngine } from '@zkdb/storage';
import { CircuitString, Poseidon, PrivateKey, PublicKey, UInt32 } from 'o1js';
import { createCollection } from '../../../src/domain/use-case/collection';
import config from '../../../src/helper/config';
import { createDatabase } from '../../../src/domain/use-case/database';
import {
  buildSchema,
  validateDocumentSchema,
} from '../../../src/domain/use-case/schema';

const DB_NAME = 'test-db';
const TEST_COLLECTION = 'users';
const MERKLE_HEIGHT = 8;
const PUBLIC_KEY = PublicKey.fromPrivateKey(PrivateKey.random()).toBase58();

const dropDatabase = true;

describe('Schema Use Cases', () => {
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
    await createDatabase(DB_NAME, MERKLE_HEIGHT, PUBLIC_KEY);
  });

  afterEach(async () => {
    await dropDatabases();
  });
  describe('validateDocumentSchema', () => {
    test('validation success', async () => {
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
          {
            name: 'age',
            kind: 'UInt32',
            indexed: false,
          },
        ],
        {
          permissionOwner: { read: true },
        }
      );

      const isValid = await validateDocumentSchema(DB_NAME, TEST_COLLECTION, [
        { name: 'name', kind: 'CircuitString', value: 'John' },
        { name: 'age', kind: 'UInt32', value: '30' },
      ]);

      expect(isValid).toBeTruthy();
    });

    test('schema not found', async () => {
      const DIFFERENT_COLLECTION = 'diff-collection';

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
          {
            name: 'age',
            kind: 'UInt32',
            indexed: false,
          },
        ],
        {
          permissionOwner: { read: true },
        }
      );

      await expect(async () =>
        validateDocumentSchema(DB_NAME, DIFFERENT_COLLECTION, [
          { name: 'name', kind: 'CircuitString', value: 'John' },
          { name: 'age', kind: 'UInt32', value: '30' },
        ])
      ).rejects.toBeDefined();
    });

    test('field not defined in the schema', async () => {
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
          {
            name: 'age',
            kind: 'UInt32',
            indexed: false,
          },
        ],
        {
          permissionOwner: { read: true },
        }
      );

      const isValid = await validateDocumentSchema(DB_NAME, TEST_COLLECTION, [
        { name: 'name', kind: 'CircuitString', value: 'John' },
        { name: 'age', kind: 'UInt32', value: '30' },
        { name: 'salary', kind: 'UInt32', value: '14657' },
      ]);

      expect(isValid).toBeFalsy();
    });

    test('document field missing', async () => {
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
          {
            name: 'age',
            kind: 'UInt32',
            indexed: false,
          },
        ],
        {
          permissionOwner: { read: true },
        }
      );

      const isValid = await validateDocumentSchema(DB_NAME, TEST_COLLECTION, [
        { name: 'name', kind: 'CircuitString', value: 'John' },
      ]);

      expect(isValid).toBeFalsy();
    });
    test('incorrect field kind', async () => {
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
          {
            name: 'age',
            kind: 'UInt32',
            indexed: false,
          },
        ],
        {
          permissionOwner: { read: true },
        }
      );

      const isValid = await validateDocumentSchema(DB_NAME, TEST_COLLECTION, [
        { name: 'name', kind: 'CircuitString', value: 'John' },
        { name: 'age', kind: 'UInt64', value: '30' },
      ]);

      expect(isValid).toBeFalsy();
    });
  });

  describe('buildSchema', () => {
    test('successful schema construction', async () => {
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
          {
            name: 'age',
            kind: 'UInt32',
            indexed: false,
          },
        ],
        {
          permissionOwner: { read: true },
        }
      );

      const schema = await buildSchema(DB_NAME, TEST_COLLECTION, [
        { name: 'name', kind: 'CircuitString', value: 'John' },
        { name: 'age', kind: 'UInt32', value: '30' },
      ]);

      const expectedHash = Poseidon.hash(
        CircuitString.fromString('John')
          .toFields()
          .concat(UInt32.from(30).toFields())
      );
      expect(schema.hash()).toEqual(expectedHash);

      const serializedDocument = schema.serialize();

      console.log('serializedDocument', serializedDocument);
      expect(serializedDocument[0].name).toEqual('name');
      expect(serializedDocument[0].kind).toEqual('CircuitString');
      expect(serializedDocument[0].value).toEqual('John');

      expect(serializedDocument[1].name).toEqual('age');
      expect(serializedDocument[1].kind).toEqual('UInt32');
      expect(serializedDocument[1].value).toEqual('30');
    });
  });
});

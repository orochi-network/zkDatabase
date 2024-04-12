import { DatabaseEngine } from '@zkdb/storage';
import { Field } from 'o1js';
import { createDatabase } from '../../../src/domain/use-case/database';
import { createCollection } from '../../../src/domain/use-case/collection';
import { createDocument } from '../../../src/domain/use-case/document';
import config from '../../../src/helper/config';
import { Schema } from '../../../src/domain/common/schema';

const DB_NAME = 'test-db';
const TEST_COLLECTION = 'users';
const MERKLE_HEIGHT = 8;

describe('Document Domain', () => {
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
    await createDatabase(DB_NAME, MERKLE_HEIGHT);
  });

  afterEach(async () => {
    await dropDatabases();
  });

  describe('createDocument use case', () => {
    test('should not create document to the collection as create permission is missed', async () => {
      const COLLECTION_OWNER = 'IAM';
      const COLLECTION_GROUP = 'users';

      const DOCUMENT_OWNER = 'IAM';

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
          permissionOwner: {
            read: true,
          },
        }
      );

      await expect(async () => {
        await createDocument(
          DB_NAME,
          TEST_COLLECTION,
          DOCUMENT_OWNER,
          [
            {
              name: 'name',
              kind: 'CircuitString',
              value: 'John',
            },
          ],
          {
            permissionOwner: {
              read: true,
            },
          }
        );
      }).rejects.toThrow();
    });

    test('should create document and return merkle witness', async () => {
      const COLLECTION_OWNER = 'IAM';
      const COLLECTION_GROUP = 'users';

      const DOCUMENT_OWNER = 'IAM';

      class User extends Schema.create(
        {
          name: Field,
        },
        ['name']
      ) {}

      
      await createCollection(
        DB_NAME,
        TEST_COLLECTION,
        COLLECTION_OWNER,
        COLLECTION_GROUP,
        User.getSchema(),
        {
          permissionOwner: {
            create: true,
            read: true,
          },
        }
      );

      const john = new User({
        name: Field(12)
      })

      const witness = await createDocument(
        DB_NAME,
        TEST_COLLECTION,
        DOCUMENT_OWNER,
        john.serialize(),
        {
          permissionOwner: {
            read: true,
          },
        }
      );

      console.log('witness', witness);
    });
  });

  describe('readDocument usecase', () => {

    test("should return requested document", () => {
      
    })
  })
});

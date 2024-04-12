import { DatabaseEngine } from '@zkdb/storage';
import config from '../../../src/helper/config';
import { createDatabase } from '../../../src/domain/use-case/database';
import { checkCollectionPermission } from '../../../src/domain/use-case/permission';
import { createCollectionMetadata } from '../../../src/domain/use-case/collection-metadata';

const DB_NAME = 'test-db-schema';
const TEST_COLLECTION = 'users';
const MERKLE_HEIGHT = 8;

describe('Permission UseCases', () => {
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
    await createDatabase(DB_NAME, MERKLE_HEIGHT)
  });

  afterEach(async () => {
    await dropDatabases();
  });

  describe('checkPermission', () => {
    test('checkPermission should return true for read permission on created schema for owner', async () => {
      const schema = [
        { name: 'name', kind: 'Field', indexed: true },
        { name: 'admin', kind: 'Bool', indexed: false },
      ];

      const permissions = {
        permissionOwner: { read: true, write: true },
        permissionGroup: { read: false },
        permissionOther: { read: false },
      };

      const schemas = schema.reduce((acc: any, field: any) => {
        acc[field[0]] = {
          name: field[0],
          kind: field[1],
          value: field[2],
        };
        return acc;
      }, []);

      await createCollectionMetadata(
        DB_NAME,
        TEST_COLLECTION,
        schemas,
        permissions,
        'IAM',
        'users'
      );

      const permitted = await checkCollectionPermission(
        DB_NAME,
        TEST_COLLECTION,
        'IAM',
        'read'
      );

      expect(permitted).toBeTruthy();
    });
    test('checkPermission should return false for write permission on created schema for group', async () => {
      const schema = [
        { name: 'name', kind: 'Field', indexed: true },
        { name: 'admin', kind: 'Bool', indexed: false },
      ];

      const permissions = {
        permissionOwner: { read: true, write: true },
        permissionGroup: { read: true, write: false },
        permissionOther: { read: false },
      };

      // const permissionOwner = PermissionBinary.toBinaryPermission(
      //   partialToPermission(permissions.permissionOwner)
      // );
      // const permissionGroup = PermissionBinary.toBinaryPermission(
      //   partialToPermission(permissions.permissionGroup)
      // );
      // const permissionOther = PermissionBinary.toBinaryPermission(
      //   partialToPermission(permissions.permissionOther)
      // );

      const schemas = schema.reduce((acc: any, field: any) => {
        acc[field[0]] = {
          name: field[0],
          kind: field[1],
          value: field[2],
        };
        return acc;
      }, {});

      await createCollectionMetadata(
        DB_NAME,
        TEST_COLLECTION,
        schemas,
        permissions,
        'IAM',
        'users'
      );

      let permitted = await checkCollectionPermission(
        DB_NAME,
        TEST_COLLECTION,
        'users',
        'read'
      );
      expect(permitted).toBeTruthy();
      permitted = await checkCollectionPermission(
        DB_NAME,
        TEST_COLLECTION,
        'IAM',
        'read'
      );
      expect(permitted).toBeTruthy();
      permitted = await checkCollectionPermission(
        DB_NAME,
        TEST_COLLECTION,
        'users',
        'write'
      );
      expect(permitted).toBeFalsy();
    });
  });
});

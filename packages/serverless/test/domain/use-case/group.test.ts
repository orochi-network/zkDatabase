import { DatabaseEngine } from '@zkdb/storage';
import { PrivateKey, PublicKey } from 'o1js';
import { createDatabase } from '../../../src/domain/use-case/database';
import config from '../../../src/helper/config';
import {
  addUserToGroups,
  checkUserGroupMembership,
  createGroup,
  isGroupExist,
} from '../../../src/domain/use-case/group';

const DB_NAME = 'test-db-schema';
const TEST_COLLECTION = 'users';
const MERKLE_HEIGHT = 8;
const TEST_GROUP = 'My Group';
const PUBLIC_KEY = PublicKey.fromPrivateKey(PrivateKey.random()).toBase58();

describe('Group Use Cases', () => {
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
    await createDatabase(DB_NAME, MERKLE_HEIGHT, PUBLIC_KEY);
  });

  afterEach(async () => {
    await dropDatabases();
  });

  describe('Create and Read Group Use Case', () => {
    test('new group created successfully', async () => {
      const isCreated = await createGroup(DB_NAME, TEST_COLLECTION, TEST_GROUP);
      expect(isCreated).toBeTruthy();

      const isExist = await isGroupExist(DB_NAME, TEST_GROUP);
      expect(isExist).toBeTruthy();
    });

    test('failed as group is already exist', async () => {
      const isCreated = await createGroup(DB_NAME, TEST_COLLECTION, TEST_GROUP);
      expect(isCreated).toBeTruthy();

      await expect(async () =>
        createGroup(DB_NAME, TEST_COLLECTION, TEST_GROUP)
      ).rejects.toBeDefined();
    });
  });

  describe('Check membership', () => {
    test('user is part of multiple groups', async () => {
      const FIRST_GROUP = 'first group';
      const SECOND_GROUP = 'second group';
      const ACTOR = "IAM"

      const isCreated1 = await createGroup(
        DB_NAME,
        ACTOR,
        FIRST_GROUP
      );
      const isCreated2 = await createGroup(
        DB_NAME,
        ACTOR,
        SECOND_GROUP
      );

      expect(isCreated1).toBeTruthy();
      expect(isCreated2).toBeTruthy();

      await addUserToGroups(DB_NAME, ACTOR, [FIRST_GROUP, SECOND_GROUP]);

      const isPart1 = await checkUserGroupMembership(
        DB_NAME,
        ACTOR,
        FIRST_GROUP
      );
      const isPart2 = await checkUserGroupMembership(
        DB_NAME,
        ACTOR,
        SECOND_GROUP
      );

      expect(isPart1).toBeTruthy();
      expect(isPart2).toBeTruthy();
    });

    test('user belong to one group, but does not belong to another', async () => {
      const SECOND_GROUP = 'second group';
      const ACTOR = "IAM"

      const isCreated1 = await createGroup(
        DB_NAME,
        ACTOR,
        TEST_GROUP
      );

      const isCreated2 = await createGroup(
        DB_NAME,
        ACTOR,
        SECOND_GROUP
      );

      expect(isCreated1).toBeTruthy();
      expect(isCreated2).toBeTruthy();

      await addUserToGroups(DB_NAME, ACTOR, [TEST_GROUP]);

      const isPart1 = await checkUserGroupMembership(
        DB_NAME,
        ACTOR,
        TEST_GROUP
      );
      const isPart2 = await checkUserGroupMembership(
        DB_NAME,
        ACTOR,
        SECOND_GROUP
      );

      expect(isPart1).toBeTruthy();
      expect(isPart2).toBeFalsy();
    });
  });
});

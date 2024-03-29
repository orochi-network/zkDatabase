import { Field, UInt32 } from 'o1js';
import { DatabaseEngine } from '@zkdb/storage';
import { ModelSchema } from '../../../src/model/database/schema';
import { PermissionBasic } from '../../../src/common/permission';
import { Schema } from '../../../src/model/common/schema';
import config from '../../../src/helper/config';
import { CreateGlobalDatabaseUseCase } from '../../../src/domain/use-case/create-global-database';

const DB_NAME = 'test-db-schema';
const MERKLE_HEIGHT = 8;

describe('ModelSchema', () => {
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
    const userDatabases = databases.filter(dbInfo => !['admin', 'local', 'config'].includes(dbInfo.name));
  
    // Drop each user database
    await Promise.all(userDatabases.map(async (dbInfo) => {
      console.log(`Dropping database: ${dbInfo.name}`);
      const db = dbEngine.client.db(dbInfo.name);
      await db.dropDatabase();
    }));
  
    console.log('All user databases have been dropped.');
  }

  beforeEach(async () => {
    await dropDatabases();
    await new CreateGlobalDatabaseUseCase().execute({
      databaseName: DB_NAME,
      merkleHeight: MERKLE_HEIGHT,
    });
  });

  afterEach(async () => {
    await dropDatabases();
  });

  it('create new collection with schema, handle schema properly', async () => {
    // Set up
    const COLLECTION_NAME = 'users';

    const modelSchema = ModelSchema.getInstance(DB_NAME);

    class User extends Schema.create(
      {
        name: Field,
        age: UInt32,
      },
      ['age']
    ) {}

    const filePermissions: PermissionBasic = {
      owner: 'alice',
      group: 'developers',
      permissionOwner: 7,
      permissionGroup: 6,
      permissionOther: 4,
    };

    // Execute
    await modelSchema.createSchema(COLLECTION_NAME, {
      schemas: User.getSchema(),
      permission: filePermissions,
    });

    // Verify
    const createdSchema = await modelSchema.getSchema(COLLECTION_NAME);
    expect(createdSchema).toBeDefined();
    expect(createdSchema.fields).toContain('name');
    expect(createdSchema.fields).toContain('age');
  });
});

import { Field, UInt32 } from 'o1js';
import { DatabaseEngine } from '../../../src/model/abstract/database-engine';
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

  async function dropDatabase() {
    const db = dbEngine.client.db(DB_NAME);
    if (db) {
      await db.dropDatabase();
    }
  }

  beforeEach(async () => {
    await dropDatabase();
    await new CreateGlobalDatabaseUseCase().execute({
      databaseName: DB_NAME,
      merkleHeight: MERKLE_HEIGHT,
    });
  });

  afterEach(async () => {
    await dropDatabase();
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

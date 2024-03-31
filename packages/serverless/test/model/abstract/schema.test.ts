import { Field, UInt32 } from 'o1js';
import { DatabaseEngine } from '@zkdb/storage';
import { ObjectId } from 'mongodb';
import { ModelSchema } from '../../../src/model/database/schema';
import { PermissionBasic } from '../../../src/common/permission';
import { Schema } from '../../../src/model/common/schema';
import config from '../../../src/helper/config';
import { CreateGlobalDatabaseUseCase } from '../../../src/domain/use-case/create-global-database';
import { DocumentRecord } from '../../../src/model/abstract/document';

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
      const db = dbEngine.client.db(dbInfo.name);
      await db.dropDatabase();
    }));
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

  const mockSchema = {
    collection: 'testCollection',
    fields: ['name', 'age'],
    name: { kind: 'Field', indexed: false },
    age: { kind: 'Field', indexed: false },
    createdAt: new Date(),
    updatedAt: new Date(),
    permissionOwner: 7,
    permissionGroup: 6,
    permissionOther: 4,
  };

  describe('validateDocument', () => {
    it('should return true for a valid document', () => {
      const fields = [
        { name: 'name', kind: 'Field', value: 'Alice' },
        { name: 'age', kind: 'Field', value: '30' },
      ];
  
      const validDocument: DocumentRecord = fields.reduce((acc, field) => {
        acc[field.name] = { name: field.name, kind: field.kind, value: field.value };
        return acc;
      }, { _id: new ObjectId() } as DocumentRecord);
  
      expect(ModelSchema.validateDocument(mockSchema, validDocument)).toBe(true);
    });
  
    it('should return false for an invalid document kind', () => {
      const fields = [
        { name: 'name', kind: 'Field', value: 'Alice' },
        { name: 'age', kind: 'CircuitValue', value: 'thirty' }, // Invalid value
      ];
  
      const invalidDocument: DocumentRecord = fields.reduce((acc, field) => {
        acc[field.name] = { name: field.name, kind: field.kind, value: field.value };
        return acc;
      }, { _id: new ObjectId() } as DocumentRecord);
  
      expect(ModelSchema.validateDocument(mockSchema, invalidDocument)).toBe(false);
    });

    it('should return false for an invalid document name', () => {
      const fields = [
        { name: 'name', kind: 'Field', value: 'Alice' },
        { name: 'age123', kind: 'Field', value: 'thirty' }, // Invalid name
      ];
  
      const invalidDocument: DocumentRecord = fields.reduce((acc, field) => {
        acc[field.name] = { name: field.name, kind: field.kind, value: field.value };
        return acc;
      }, { _id: new ObjectId() } as DocumentRecord);
  
      expect(ModelSchema.validateDocument(mockSchema, invalidDocument)).toBe(false);
    });
  
    it('should return false for a document with missing fields', () => {
      const fields = [
        { name: 'name', kind: 'Field', value: 'Alice' }, // Missing 'age' field
      ];
  
      const incompleteDocument: DocumentRecord = fields.reduce((acc, field) => {
        acc[field.name] = { name: field.name, kind: field.kind, value: field.value };
        return acc;
      }, { _id: new ObjectId() } as DocumentRecord);
  
      expect(ModelSchema.validateDocument(mockSchema, incompleteDocument)).toBe(false);
    });
  });
  
  describe('validateUpdate', () => {
    it('should return true for a valid update', () => {
      const fields = [
        { name: 'name', kind: 'Field', value: 'Alice' },
        { name: 'age', kind: 'Field', value: '31' }, // Valid update
      ];
  
      const validUpdate: DocumentRecord = fields.reduce((acc, field) => {
        acc[field.name] = { name: field.name, kind: field.kind, value: field.value };
        return acc;
      }, { _id: new ObjectId() } as DocumentRecord);
  
      expect(ModelSchema.validateUpdate(mockSchema, validUpdate)).toBe(true);
    });
  });

});

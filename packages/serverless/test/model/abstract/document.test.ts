/* eslint-disable no-await-in-loop */
/* eslint-disable max-classes-per-file */
import { DatabaseEngine, ModelMerkleTree } from '@zkdb/storage';
import { Field, MerkleTree, UInt32 } from 'o1js';
import ModelDocument, {
  DocumentRecord,
} from '../../../src/model/abstract/document';
import { ModelSchema } from '../../../src/model/database/schema';
import { PermissionBasic } from '../../../src/common/permission';
import ModelDocumentMetadata from '../../../src/model/database/document-metadata';
import { Schema } from '../../../src/model/common/schema';
import config from '../../../src/helper/config';
import { CreateGlobalDatabaseUseCase } from '../../../src/domain/use-case/create-global-database';

const DB_NAME = 'test-db-document';
const COLLECTION_NAME = 'test-db';
const MERKLE_HEIGHT = 8;

describe('ModelDocument', () => {
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
  
  test('should return the correct structured schema and document when both are found', async () => {
    // Set up
    const modelDocument = ModelDocument.getInstance(DB_NAME, COLLECTION_NAME);
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
  
    await modelSchema.createSchema(COLLECTION_NAME, {
      schemas: User.getSchema(),
      permission: filePermissions,
    });
    
    const newUser = new User({ name: Field(0), age: UInt32.from(2) });
  
    const documentObject: DocumentRecord = newUser
    .serialize()
    .reduce((acc: any, field) => {
      acc[field[0]] = {
        name: field[0],
        kind: field[1],
        value: field[2],
      };
      return acc;
    }, {});
  
    const result = await modelDocument.collection.insertOne(documentObject);
  
    const details = await modelDocument.getDocumentDetail(result!.insertedId);

    // Verify
    expect(details).toBeDefined();
    expect(details?.document._id).toEqual(result.insertedId);
    expect(details?.schema.fields).toEqual(['name', 'age']);
    expect(details?.schema.owner).toEqual('alice');
    expect(details?.schema.group).toEqual('developers');
    expect(details?.schema.permissionOwner).toEqual(7);
    expect(details?.schema.permissionGroup).toEqual(6);
    expect(details?.schema.permissionOther).toEqual(4);
    expect(details?.structuredSchema.getSchema()).toEqual([
      { name: 'name', kind: 'Field', indexed: false },
      { name: 'age', kind: 'UInt32', indexed: true }
    ]);

    expect(Field(details?.structuredDocument.name.value)).toEqual(Field(0));
    expect(details?.structuredDocument.age.value).toEqual(Field(2));
  });
  

  it('should insert a new user document, update metadata, and verify merkle witness', async () => {
    // Set up

    // Define modules which are used in the test
    const modelDocument = ModelDocument.getInstance(DB_NAME, COLLECTION_NAME);
    const modelSchema = ModelSchema.getInstance(DB_NAME);
    const modelDocumentMetadata = new ModelDocumentMetadata(DB_NAME);
    const modelMerkleTree = ModelMerkleTree.getInstance(DB_NAME);

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

    await modelSchema.createSchema(COLLECTION_NAME, {
      schemas: User.getSchema(),
      permission: filePermissions,
    });

    const newUser = new User({ name: Field(0), age: UInt32.from(2) });

    const documentObject: DocumentRecord = newUser
      .serialize()
      .reduce((acc: any, field) => {
        acc[field[0]] = {
          name: field[0],
          kind: field[1],
          value: field[2],
        };
        return acc;
      }, {});

    const testMerkleTree = new MerkleTree(MERKLE_HEIGHT);
    testMerkleTree.setLeaf(0n, newUser.hash());

    const EXPECTED_MERKLE_WITNESS = testMerkleTree.getWitness(0n);

    // Execute
    const result = await modelDocument.insertOne(documentObject);

    // Verify

    // Check model document
    expect(result).toBeDefined();
    expect(result!.acknowledged).toBeTruthy();
    expect(result!.insertedId).toBeDefined();

    // Check document metadata
    const metadataResult = await modelDocumentMetadata.findOne({
      docId: result?.insertedId,
    });

    expect(metadataResult).toBeDefined();

    // Check merkle tree
    const merkleWitness = await modelMerkleTree.getWitness(
      BigInt(metadataResult!.merkleIndex),
      new Date()
    );

    expect(merkleWitness.toString()).toEqual(
      EXPECTED_MERKLE_WITNESS.toString()
    );
  });

  it('should insert 3 new users documents, update metadata, and verify merkle witness', async () => {
    // Set up
    

    // Define modules which are used in the test
    const modelDocument = ModelDocument.getInstance(DB_NAME, COLLECTION_NAME);
    const modelSchema = ModelSchema.getInstance(DB_NAME);
    const modelDocumentMetadata = new ModelDocumentMetadata(DB_NAME);
    const modelMerkleTree = ModelMerkleTree.getInstance(DB_NAME);

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

    await modelSchema.createSchema(COLLECTION_NAME, {
      schemas: User.getSchema(),
      permission: filePermissions,
    });

    const testMerkleTree = new MerkleTree(MERKLE_HEIGHT);

    for (let i = 0; i < 3; i += 1) {
      const MERKLE_INDEX = BigInt(i);

      const newUser = new User({ name: Field(i), age: UInt32.from(i + 2) });

      const documentObject: DocumentRecord = newUser
        .serialize()
        .reduce((acc: any, field) => {
          acc[field[0]] = {
            name: field[0],
            kind: field[1],
            value: field[2],
          };
          return acc;
        }, {});

      testMerkleTree.setLeaf(MERKLE_INDEX, newUser.hash());

      const EXPECTED_MERKLE_WITNESS = testMerkleTree.getWitness(MERKLE_INDEX);

      // Execute
      const result = await modelDocument.insertOne(documentObject);

      // Verify

      // Check model document
      expect(result).toBeDefined();
      expect(result!.acknowledged).toBeTruthy();
      expect(result!.insertedId).toBeDefined();

      // Check document metadata
      const metadataResult = await modelDocumentMetadata.findOne({
        docId: result?.insertedId,
      });

      expect(metadataResult).toBeDefined();
      
      // Check merkle tree
      const merkleWitness = await modelMerkleTree.getWitness(
        BigInt(metadataResult!.merkleIndex),
        new Date()
      );

      expect(merkleWitness.toString()).toEqual(
        EXPECTED_MERKLE_WITNESS.toString()
      );
    }
  });

  it('should update a user document and verify merkle witness', async () => {
    // Set up

    // Define modules which are used in the test
    const modelDocument = ModelDocument.getInstance(DB_NAME, COLLECTION_NAME);
    const modelSchema = ModelSchema.getInstance(DB_NAME);
    const modelDocumentMetadata = new ModelDocumentMetadata(DB_NAME);
    const modelMerkleTree = ModelMerkleTree.getInstance(DB_NAME);

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

    await modelSchema.createSchema(COLLECTION_NAME, {
      schemas: User.getSchema(),
      permission: filePermissions,
    });

    // new user
    const newUser = new User({ name: Field(0), age: UInt32.from(2) });
    const documentObject: DocumentRecord = newUser
      .serialize()
      .reduce((acc: any, field) => {
        acc[field[0]] = {
          name: field[0],
          kind: field[1],
          value: field[2],
        };
        return acc;
      }, {});

    // update user
    const updatedUser = new User({ name: Field(1), age: UInt32.from(5) });
    const updatedDocumentObject: DocumentRecord = updatedUser
      .serialize()
      .reduce((acc: any, field) => {
        acc[field[0]] = {
          name: field[0],
          kind: field[1],
          value: field[2],
        };
        return acc;
      }, {});

    const testMerkleTree = new MerkleTree(MERKLE_HEIGHT);
    testMerkleTree.setLeaf(0n, updatedUser.hash());

    const EXPECTED_MERKLE_WITNESS = testMerkleTree.getWitness(0n);

    // Execute
    const insertResult = await modelDocument.insertOne(documentObject);
    const result = await modelDocument.updateOne(
      {
        _id: insertResult!.insertedId,
      },
      updatedDocumentObject
    );

    // Verify

    // Check model document
    expect(result).toBeDefined();
    expect(result!.acknowledged).toBeTruthy();

    // Check document metadata
    const metadataResult = await modelDocumentMetadata.findOne({
      docId: insertResult?.insertedId,
    });

    expect(metadataResult).toBeDefined();

    // Check merkle tree
    const merkleWitness = await modelMerkleTree.getWitness(
      BigInt(metadataResult!.merkleIndex),
      new Date()
    );

    expect(merkleWitness.toString()).toEqual(
      EXPECTED_MERKLE_WITNESS.toString()
    );
  });
});

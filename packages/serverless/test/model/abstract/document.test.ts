/* eslint-disable no-await-in-loop */
/* eslint-disable max-classes-per-file */
import { Field, MerkleTree, UInt32 } from 'o1js';
import { DatabaseEngine } from '../../../src/model/abstract/database-engine';
import ModelDocument, {
  DocumentRecord,
} from '../../../src/model/abstract/document';
import { ModelSchema } from '../../../src/model/database/schema';
import ModelDatabase from '../../../src/model/abstract/database';
import { PermissionBasic } from '../../../src/common/permission';
import ModelDocumentMetadata from '../../../src/model/database/document-metadata';
import ModelMerkleTree from '../../../src/model/database/merkle-tree';
import { Schema } from '../../../src/model/common/schema';
import config from '../../../src/helper/config';

const DB_NAME = 'test-db-document';
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

  async function dropDatabase() {
    const db = dbEngine.client.db(DB_NAME);
    if (db) {
      await db.dropDatabase();
    }
  }

  beforeEach(async () => {
    await dropDatabase();
    await ModelDatabase.create(DB_NAME, MERKLE_HEIGHT);
  });

  afterEach(async () => {
    await dropDatabase();
  });

  it('should insert a new user document, update metadata, and verify merkle witness', async () => {
    // Set up
    const COLLECTION_NAME = 'test-db';

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
    const COLLECTION_NAME = 'test-db';

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
    const COLLECTION_NAME = 'test-db';

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

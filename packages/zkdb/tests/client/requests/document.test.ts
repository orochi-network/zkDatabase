import { Bool, Field, MerkleTree } from 'o1js';
import {
  createCollection,
  createDatabase,
  createDocument,
  readDocument,
} from '../../../src/client/index.js';
import { Schema } from '../../../src/core/schema.js';

const DB_DAME = 'mytestdb';
const MERKLE_HEIGHT = 12;
const COLLECTION_NAME = 'user';

describe('Document Model Requests', () => {
  test('should create new document and it should be included to the list', async () => {
    const dbCreateResponse = await createDatabase(DB_DAME, MERKLE_HEIGHT);
    const isDbCreated = dbCreateResponse.dbCreate;

    expect(isDbCreated).toBeTruthy();

    const schema = [
      { name: 'name', kind: 'Field', indexed: true },
      { name: 'admin', kind: 'Bool', indexed: false },
    ];

    const permissions = {
      permissionOwner: { read: true, write: true, create: true },
      permissionGroup: { read: true },
      permissionOthers: { read: false },
    };

    const collectionCreateResponse = await createCollection(
      DB_DAME,
      COLLECTION_NAME,
      "group",
      "",
      schema,
      permissions
    );
    const isCollectionCreated = collectionCreateResponse.collectionCreate;

    expect(isCollectionCreated).toBeTruthy();

    class User extends Schema.create({
      name: Field,
      admin: Bool,
    }) {}

    const newUser = new User({
      name: Field(4),
      admin: Bool(false),
    });

    const response = await createDocument(
      DB_DAME,
      COLLECTION_NAME,
      newUser.serialize(),
      {}
    );

    console.log('response', response)

    const merkleTree = new MerkleTree(MERKLE_HEIGHT);
    merkleTree.setLeaf(1n, newUser.hash());

    expect(response.witness.toString()).toEqual(merkleTree.getWitness(1n).toString());
  });

  test('should read document', async () => {
    const result = await readDocument(
      DB_DAME,
      COLLECTION_NAME,
      {
        name: 4
      }
    )

    console.log('result', result)
  })
});

/* eslint-disable max-len */
/* eslint-disable max-classes-per-file */
import { DatabaseEngine, withTransaction } from '@zkdb/storage';
import { CircuitString, MerkleTree, PrivateKey, PublicKey, UInt64 } from 'o1js';
import { Schema } from '../../../src/domain/common/schema.js';
import { FullPermissions } from '../../../src/domain/types/permission.js';
import { createCollection } from '../../../src/domain/use-case/collection.js';
import { createDatabase } from '../../../src/domain/use-case/database.js';
import { readHistoryDocument } from '../../../src/domain/use-case/document-history.js';
import {
  createDocument,
  deleteDocument,
  readDocument,
  searchDocuments,
  updateDocument,
} from '../../../src/domain/use-case/document.js';
import { createGroup } from '../../../src/domain/use-case/group.js';
import { readMetadata } from '../../../src/domain/use-case/metadata.js';
import { changeDocumentOwnership } from '../../../src/domain/use-case/ownership.js';
import { setPermissions } from '../../../src/domain/use-case/permission.js';
import ModelUser from '../../../src/model/global/user.js';

const DB_NAME = 'test-db';
const DB_OWNER = 'god';
const COLLECTION_OWNER = 'collection-owner';
const ANOTHER_OWNER = 'another-owner';
const TEST_COLLECTION = 'test-collection';
const GROUP_NAME = 'test-group';

const MERKLE_HEIGHT = 8;
const PUBLIC_KEY = PublicKey.fromPrivateKey(PrivateKey.random()).toBase58();

const dropDatabase = true;

class Person extends Schema.create({
  name: CircuitString,
  age: UInt64,
}) {}

const DEFAULT_PERMISSIONS = {
  permissionOwner: {
    read: true,
    write: true,
    delete: true,
    system: true,
    create: true,
  },
  permissionGroup: {
    read: true,
    write: true,
    delete: true,
    create: true,
    system: false,
  },
  permissionOther: {
    read: false,
    write: false,
    delete: false,
    create: false,
    system: false,
  },
};

describe('Document Management Integration Tests', () => {
  let dbEngine: DatabaseEngine;

  beforeAll(async () => {
    dbEngine = DatabaseEngine.getInstance(
      'mongodb+srv://magestrio:Q1w2e3r498oleg.@cluster0.z4afzzy.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0'
    );
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
    await createDatabase(DB_NAME, MERKLE_HEIGHT, DB_OWNER, PUBLIC_KEY);
    await createGroup(DB_NAME, DB_OWNER, GROUP_NAME, 'random');

    await createCollection(
      DB_NAME,
      TEST_COLLECTION,
      COLLECTION_OWNER,
      GROUP_NAME,
      Person.getSchema(),
      DEFAULT_PERMISSIONS
    );
  });

  afterEach(async () => {
    await dropDatabases();
  });

  describe('Create Document', () => {
    test('collection owner create document successfully with default permissions', async () => {
      // Set up
      const merkleTree = new MerkleTree(MERKLE_HEIGHT);
      const person = new Person({
        name: CircuitString.fromString('John'),
        age: UInt64.from(12),
      });

      merkleTree.setLeaf(1n, person.hash());

      // Execute
      const merkleWitness = await createDocument(
        DB_NAME,
        TEST_COLLECTION,
        COLLECTION_OWNER,
        person.serialize(),
        DEFAULT_PERMISSIONS
      );

      // Verify
      expect(merkleWitness).toEqual(merkleTree.getWitness(1n));
    });

    test('collection owner create document unsuccessfully with create set to false', async () => {
      // Set up
      const merkleTree = new MerkleTree(MERKLE_HEIGHT);
      const person = new Person({
        name: CircuitString.fromString('John'),
        age: UInt64.from(12),
      });

      merkleTree.setLeaf(1n, person.hash());

      await setPermissions(DB_NAME, TEST_COLLECTION, COLLECTION_OWNER, null, {
        ...DEFAULT_PERMISSIONS,
        permissionOwner: {
          create: false,
        },
      } as FullPermissions);

      // Execute
      await expect(async () => {
        return createDocument(
          DB_NAME,
          TEST_COLLECTION,
          COLLECTION_OWNER,
          person.serialize(),
          DEFAULT_PERMISSIONS
        );
      }).rejects.toThrow();
    });

    test('collection owner create document successfully and retrieve it', async () => {
      const person = new Person({
        name: CircuitString.fromString('John'),
        age: UInt64.from(12),
      });

      // Execute
      await createDocument(
        DB_NAME,
        TEST_COLLECTION,
        COLLECTION_OWNER,
        person.serialize(),
        DEFAULT_PERMISSIONS
      );

      const fetchedDocument = await readDocument(
        DB_NAME,
        TEST_COLLECTION,
        COLLECTION_OWNER,
        { name: 'John' }
      );

      const fetchedPerson = Person.deserialize(fetchedDocument!.fields);

      expect(person).toEqual(fetchedPerson);
    });
  });

  describe('Update Document', () => {
    test('collection owner update document and retrieve the latest version', async () => {
      const person = new Person({
        name: CircuitString.fromString('John'),
        age: UInt64.from(12),
      });

      const updatePerson = new Person({
        name: CircuitString.fromString('John'),
        age: UInt64.from(13),
      });

      // Execute
      await createDocument(
        DB_NAME,
        TEST_COLLECTION,
        COLLECTION_OWNER,
        person.serialize(),
        DEFAULT_PERMISSIONS
      );
      await withTransaction((session) =>
        updateDocument(
          DB_NAME,
          TEST_COLLECTION,
          COLLECTION_OWNER,
          { name: 'John' },
          updatePerson.serialize(),
          session
        )
      );

      const fetchedDocument = await readDocument(
        DB_NAME,
        TEST_COLLECTION,
        COLLECTION_OWNER,
        { name: 'John' }
      );

      const fetchedPerson = Person.deserialize(fetchedDocument!.fields);

      expect(updatePerson).toEqual(fetchedPerson);
    });
  });

  describe('Delete Document', () => {
    test('collection owner delete document and get error after trying to read it', async () => {
      const person = new Person({
        name: CircuitString.fromString('John'),
        age: UInt64.from(12),
      });

      // Execute
      await createDocument(
        DB_NAME,
        TEST_COLLECTION,
        COLLECTION_OWNER,
        person.serialize(),
        DEFAULT_PERMISSIONS
      );

      await deleteDocument(DB_NAME, TEST_COLLECTION, COLLECTION_OWNER, {
        name: 'John',
      });

      const fetchedDocument = await readDocument(
        DB_NAME,
        TEST_COLLECTION,
        COLLECTION_OWNER,
        { name: 'John' }
      );

      expect(fetchedDocument).toEqual(null);
    });
  });

  describe('Document History', () => {
    test('collection owner update document and get history', async () => {
      const person = new Person({
        name: CircuitString.fromString('John'),
        age: UInt64.from(12),
      });

      const updatePerson = new Person({
        name: CircuitString.fromString('John'),
        age: UInt64.from(13),
      });

      // Execute
      await createDocument(
        DB_NAME,
        TEST_COLLECTION,
        COLLECTION_OWNER,
        person.serialize(),
        DEFAULT_PERMISSIONS
      );
      await withTransaction((session) =>
        updateDocument(
          DB_NAME,
          TEST_COLLECTION,
          COLLECTION_OWNER,
          { name: 'John' },
          updatePerson.serialize(),
          session
        )
      );

      const fetchedDocument = await readDocument(
        DB_NAME,
        TEST_COLLECTION,
        COLLECTION_OWNER,
        { name: 'John' }
      );

      const documents = await readHistoryDocument(
        DB_NAME,
        TEST_COLLECTION,
        COLLECTION_OWNER,
        fetchedDocument!.docId
      );

      const fetchedPerson1 = Person.deserialize(
        documents!.documents[0]!.fields
      );
      const fetchedPerson2 = Person.deserialize(
        documents!.documents[1]!.fields
      );

      expect(documents!.docId).toEqual(fetchedDocument?.docId);

      expect(fetchedPerson1).toEqual(person);
      expect(fetchedPerson2).toEqual(updatePerson);
    });

    test('collection owner update document, then delete and get history', async () => {
      const person = new Person({
        name: CircuitString.fromString('John'),
        age: UInt64.from(12),
      });

      const updatePerson = new Person({
        name: CircuitString.fromString('John'),
        age: UInt64.from(13),
      });

      // Execute
      await createDocument(
        DB_NAME,
        TEST_COLLECTION,
        COLLECTION_OWNER,
        person.serialize(),
        DEFAULT_PERMISSIONS
      );

      await withTransaction((session) =>
        updateDocument(
          DB_NAME,
          TEST_COLLECTION,
          COLLECTION_OWNER,
          { name: 'John' },
          updatePerson.serialize(),
          session
        )
      );

      const fetchedDocument = await readDocument(
        DB_NAME,
        TEST_COLLECTION,
        COLLECTION_OWNER,
        { name: 'John' }
      );

      await deleteDocument(DB_NAME, TEST_COLLECTION, COLLECTION_OWNER, {
        name: 'John',
      });

      const documents = await readHistoryDocument(
        DB_NAME,
        TEST_COLLECTION,
        COLLECTION_OWNER,
        fetchedDocument!.docId
      );

      const fetchedPerson1 = Person.deserialize(
        documents!.documents[0]!.fields
      );
      const fetchedPerson2 = Person.deserialize(
        documents!.documents[1]!.fields
      );

      expect(documents!.docId).toEqual(fetchedDocument?.docId);

      expect(fetchedPerson1).toEqual(person);
      expect(fetchedPerson2).toEqual(updatePerson);
      expect(documents?.active).toBeFalsy();
    });
  });

  describe('Document Metadata', () => {
    test('collection owner successfully changed ownership, then it does not have access to it, but new owner has', async () => {
      const person = new Person({
        name: CircuitString.fromString('John'),
        age: UInt64.from(12),
      });

      // Execute
      const modelUser = new ModelUser();
      await modelUser.create(
        ANOTHER_OWNER,
        'cat@gmail.com',
        'user.publicKey',
        undefined
      );

      await createDocument(
        DB_NAME,
        TEST_COLLECTION,
        COLLECTION_OWNER,
        person.serialize(),
        DEFAULT_PERMISSIONS
      );

      const fetchedDocument = await readDocument(
        DB_NAME,
        TEST_COLLECTION,
        COLLECTION_OWNER,
        { name: 'John' }
      );

      await changeDocumentOwnership(
        DB_NAME,
        TEST_COLLECTION,
        fetchedDocument!.docId,
        COLLECTION_OWNER,
        'User',
        ANOTHER_OWNER
      );

      const metadata = await readMetadata(
        DB_NAME,
        TEST_COLLECTION,
        fetchedDocument!.docId,
        ANOTHER_OWNER
      );

      expect(metadata.userName).toEqual(ANOTHER_OWNER);

      await expect(async () => {
        return readDocument(DB_NAME, TEST_COLLECTION, COLLECTION_OWNER, {
          name: 'John',
        });
      }).rejects.toThrow();
    });
  });

  describe('Search Document', () => {
    test('list document 3 documents out of 6 because of read other is false', async () => {
      for (let i = 0; i < 3; i += 1) {
        const person = new Person({
          name: CircuitString.fromString(`John ${i}`),
          age: UInt64.from(i),
        });
        // eslint-disable-next-line no-await-in-loop
        await createDocument(
          DB_NAME,
          TEST_COLLECTION,
          COLLECTION_OWNER,
          person.serialize(),
          DEFAULT_PERMISSIONS
        );
      }

      for (let i = 0; i < 3; i += 1) {
        const person = new Person({
          name: CircuitString.fromString(`John ${10 + i}`),
          age: UInt64.from(10 + i),
        });
        // eslint-disable-next-line no-await-in-loop
        await createDocument(
          DB_NAME,
          TEST_COLLECTION,
          COLLECTION_OWNER,
          person.serialize(),
          {
            permissionOwner: {
              read: true,
              write: true,
              delete: true,
              system: true,
              create: true,
            },
            permissionGroup: {
              read: true,
              write: true,
              delete: true,
              create: true,
              system: false,
            },
            permissionOther: {
              read: true,
              write: false,
              delete: false,
              create: false,
              system: false,
            },
          }
        );
      }

      await setPermissions(DB_NAME, TEST_COLLECTION, COLLECTION_OWNER, null, {
        permissionOwner: {
          read: true,
          write: true,
          delete: true,
          system: true,
          create: true,
        },
        permissionGroup: {
          read: true,
          write: true,
          delete: true,
          create: true,
          system: false,
        },
        permissionOther: {
          read: true,
          write: false,
          delete: false,
          create: false,
          system: false,
        },
      });

      const listDocuments = await searchDocuments(
        DB_NAME,
        TEST_COLLECTION,
        ANOTHER_OWNER,
        {}
      );

      expect(listDocuments.length).toEqual(3);
      for (let i = 0; i < 3; i += 1) {
        const person = new Person({
          name: CircuitString.fromString(`John ${10 + i}`),
          age: UInt64.from(10 + i),
        });
        expect(Person.deserialize(listDocuments[i].fields)).toEqual(person);
      }
    });

    test('search document by age and return 0 out of 6, the document exists, but does not have permission`', async () => {
      for (let i = 0; i < 3; i += 1) {
        const person = new Person({
          name: CircuitString.fromString(`John ${i}`),
          age: UInt64.from(i),
        });
        // eslint-disable-next-line no-await-in-loop
        await createDocument(
          DB_NAME,
          TEST_COLLECTION,
          COLLECTION_OWNER,
          person.serialize(),
          DEFAULT_PERMISSIONS
        );
      }

      for (let i = 0; i < 3; i += 1) {
        const person = new Person({
          name: CircuitString.fromString(`John ${10 + i}`),
          age: UInt64.from(10 + i),
        });
        // eslint-disable-next-line no-await-in-loop
        await createDocument(
          DB_NAME,
          TEST_COLLECTION,
          COLLECTION_OWNER,
          person.serialize(),
          {
            permissionOwner: {
              read: true,
              write: true,
              delete: true,
              system: true,
              create: true,
            },
            permissionGroup: {
              read: true,
              write: true,
              delete: true,
              create: true,
              system: false,
            },
            permissionOther: {
              read: false,
              write: false,
              delete: false,
              create: false,
              system: false,
            },
          }
        );
      }

      await setPermissions(DB_NAME, TEST_COLLECTION, COLLECTION_OWNER, null, {
        permissionOwner: {
          read: true,
          write: true,
          delete: true,
          system: true,
          create: true,
        },
        permissionGroup: {
          read: true,
          write: true,
          delete: true,
          create: true,
          system: false,
        },
        permissionOther: {
          read: true,
          write: false,
          delete: false,
          create: false,
          system: false,
        },
      });

      const listDocuments = await searchDocuments(
        DB_NAME,
        TEST_COLLECTION,
        ANOTHER_OWNER,
        { age: 10 }
      );

      expect(listDocuments.length).toEqual(0);
    });

    test('search document by age and return 2 out of 6', async () => {
      for (let i = 0; i < 3; i += 1) {
        const person = new Person({
          name: CircuitString.fromString(`John ${i}`),
          age: UInt64.from(i),
        });
        // eslint-disable-next-line no-await-in-loop
        await createDocument(
          DB_NAME,
          TEST_COLLECTION,
          COLLECTION_OWNER,
          person.serialize(),
          DEFAULT_PERMISSIONS
        );
      }

      for (let i = 0; i < 3; i += 1) {
        const person = new Person({
          name: CircuitString.fromString(`John ${10 + i}`),
          age: UInt64.from(10 + i),
        });
        // eslint-disable-next-line no-await-in-loop
        await createDocument(
          DB_NAME,
          TEST_COLLECTION,
          COLLECTION_OWNER,
          person.serialize(),
          {
            permissionOwner: {
              read: true,
              write: true,
              delete: true,
              system: true,
              create: true,
            },
            permissionGroup: {
              read: true,
              write: true,
              delete: true,
              create: true,
              system: false,
            },
            permissionOther: {
              read: true,
              write: false,
              delete: false,
              create: false,
              system: false,
            },
          }
        );
      }

      await setPermissions(DB_NAME, TEST_COLLECTION, COLLECTION_OWNER, null, {
        permissionOwner: {
          read: true,
          write: true,
          delete: true,
          system: true,
          create: true,
        },
        permissionGroup: {
          read: true,
          write: true,
          delete: true,
          create: true,
          system: false,
        },
        permissionOther: {
          read: true,
          write: false,
          delete: false,
          create: false,
          system: false,
        },
      });

      const listDocuments = await searchDocuments(
        DB_NAME,
        TEST_COLLECTION,
        COLLECTION_OWNER,
        { age: { $lt: 2 } }
      );

      expect(listDocuments.length).toEqual(2);
    });

    test('search document by age greater than and return 3 out of 6', async () => {
      for (let i = 0; i < 3; i += 1) {
        const person = new Person({
          name: CircuitString.fromString(`John ${i}`),
          age: UInt64.from(i),
        });
        // eslint-disable-next-line no-await-in-loop
        await createDocument(
          DB_NAME,
          TEST_COLLECTION,
          COLLECTION_OWNER,
          person.serialize(),
          DEFAULT_PERMISSIONS
        );
      }

      for (let i = 0; i < 3; i += 1) {
        const person = new Person({
          name: CircuitString.fromString(`John ${10 + i}`),
          age: UInt64.from(10 + i),
        });
        // eslint-disable-next-line no-await-in-loop
        await createDocument(
          DB_NAME,
          TEST_COLLECTION,
          COLLECTION_OWNER,
          person.serialize(),
          {
            permissionOwner: {
              read: true,
              write: true,
              delete: true,
              system: true,
              create: true,
            },
            permissionGroup: {
              read: true,
              write: true,
              delete: true,
              create: true,
              system: false,
            },
            permissionOther: {
              read: true,
              write: false,
              delete: false,
              create: false,
              system: false,
            },
          }
        );
      }

      await setPermissions(DB_NAME, TEST_COLLECTION, COLLECTION_OWNER, null, {
        permissionOwner: {
          read: true,
          write: true,
          delete: true,
          system: true,
          create: true,
        },
        permissionGroup: {
          read: true,
          write: true,
          delete: true,
          create: true,
          system: false,
        },
        permissionOther: {
          read: true,
          write: false,
          delete: false,
          create: false,
          system: false,
        },
      });

      const listDocuments = await searchDocuments(
        DB_NAME,
        TEST_COLLECTION,
        COLLECTION_OWNER,
        { age: { $gt: 9 } }
      );

      expect(listDocuments.length).toEqual(3);
    });
  });
});

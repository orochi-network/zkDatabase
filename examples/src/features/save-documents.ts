import { CircuitString, UInt64 } from 'o1js';
import { AccessPermissions, Schema, ZKDatabaseClient } from 'zkdb';
import { DB_NAME, ZKDB_URL } from '../utils/config.js';

const COLLECTION_NAME = 'my-test-document-collection';
const GROUP_NAME = 'my-test-document-group';

class TShirt extends Schema.create({
  name: CircuitString,
  price: UInt64,
}) {}

async function run() {
  const zkdb = await ZKDatabaseClient.connect(ZKDB_URL);

  await zkdb.authenticator.signIn();

  await zkdb.database(DB_NAME).createGroup(GROUP_NAME, 'default description');

  await zkdb
    .database(DB_NAME)
    .createCollection(COLLECTION_NAME, GROUP_NAME, TShirt, [], {
      permissionOwner: AccessPermissions.fullAdminPermissions,
      permissionGroup: AccessPermissions.fullAccessPermissions,
      permissionOther: AccessPermissions.noPermissions,
    });

  const shirt = new TShirt({
    name: CircuitString.fromString('Guchi'),
    price: UInt64.from(12),
  });

  await zkdb
    .database(DB_NAME)
    .from(COLLECTION_NAME)
    .insert(shirt, {
      permissionOwner: {
        read: true,
        write: true,
        delete: true,
        create: true,
        system: true,
      },
      permissionGroup: {
        read: true,
        write: true,
        delete: true,
        create: true,
        system: true,
      },
      permissionOther: {
        read: true,
        write: true,
        delete: true,
        create: true,
        system: true,
      },
    });

  const database = zkdb.database(DB_NAME);

  const collection = database.from(COLLECTION_NAME);

  const document = await collection.fetchOne({ name: shirt.name.toString() });

  console.log('Proof status: ', await document?.getProofStatus());

  await zkdb.authenticator.signOut();
}

await run();

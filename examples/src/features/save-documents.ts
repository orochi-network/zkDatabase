import { CircuitString, UInt64 } from 'o1js';
import { AccessPermissions, Schema, ZKDatabaseClient } from 'zkdb';
import { faker } from '@faker-js/faker';
import { DB_NAME, ZKDB_URL } from '../utils/config.js';

const COLLECTION_NAME = 'my-test-document-collection';
const GROUP_NAME = 'my-test-document-group';

class TShirt extends Schema.create({
  name: CircuitString,
  price: UInt64,
}) {}

async function run() {
  const zkdb = await ZKDatabaseClient.connect(ZKDB_URL);

  const fakeUser = {
    username: faker.internet.username().toLowerCase(),
    email: faker.internet.email().toLowerCase(),
  };

  await zkdb.authenticator.signUp(fakeUser.username, fakeUser.email);

  await zkdb.authenticator.signIn();

  await zkdb.db(DB_NAME).create({ merkleHeight: 18 });

  await zkdb
    .db(DB_NAME)
    .group(GROUP_NAME)
    .create({ description: 'default description' });

  await zkdb
    .db(DB_NAME)
    .collection(COLLECTION_NAME)
    .create(GROUP_NAME, TShirt, [], {
      permissionOwner: AccessPermissions.fullAdminPermissions,
      permissionGroup: AccessPermissions.fullAccessPermissions,
      permissionOther: AccessPermissions.noPermissions,
    });

  const shirt = new TShirt({
    name: CircuitString.fromString('Guchi'),
    price: UInt64.from(12),
  });

  await zkdb
    .db(DB_NAME)
    .collection(COLLECTION_NAME)
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

  const database = zkdb.db(DB_NAME);

  const collection = database.collection(COLLECTION_NAME);

  const document = await collection.findOne({ name: shirt.name.toString() });

  // Polling each 5000ms to check proof status
  const checkStatus = async () => {
    // Need to be signIn because closure is another scope
    await zkdb.authenticator.signIn();

    const status = await document?.getProofStatus();
    console.log('Proof status:', status);

    if (status === 'proved') {
      console.log('Proof completed!');
      clearInterval(intervalId);
    }
  };

  const intervalId = setInterval(checkStatus, 5000);

  await zkdb.authenticator.signOut();
}

await run();

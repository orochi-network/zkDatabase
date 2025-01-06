import { CircuitString, UInt64 } from 'o1js';
import { AccessPermissions, Schema, ZkDatabaseClient } from 'zkdb';
import { faker } from '@faker-js/faker';
import { DB_NAME, ZKDB_URL } from '../utils/config.js';

class TShirt extends Schema.create({
  name: CircuitString,
  price: UInt64,
}) {}

const COLLECTION_NAME = 'my-test-document-collection';
const GROUP_NAME = 'my-test-document-group';

async function run() {
  const zkdb = await ZkDatabaseClient.connect(ZKDB_URL);

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

  const collection = zkdb.db(DB_NAME).collection(COLLECTION_NAME);

  for (let i = 0; i < 10; i++) {
    await collection.insert(
      new TShirt({
        name: CircuitString.fromString(`Guchi ${i}`),
        price: UInt64.from(i),
      })
    );
  }

  await zkdb.authenticator.signOut();
}

await run();

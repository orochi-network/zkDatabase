import { CircuitString, UInt64 } from 'o1js';
import { AccessPermissions, Schema, ZKDatabaseClient } from 'zkdb';
import { DB_NAME, ZKDB_URL } from '../utils/config.js';
import { faker } from '@faker-js/faker';

const COLLECTION_NAME = 'my-permission-collection';
const GROUP_NAME = 'my-test-group-name';
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

  const ownership = await zkdb
    .db(DB_NAME)
    .collection(COLLECTION_NAME)
    .ownership.setPermissions({
      permissionGroup: AccessPermissions.noPermissions,
    });

  console.log('ownership', ownership);

  await zkdb.authenticator.signOut();
}

await run();

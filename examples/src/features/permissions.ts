import { CircuitString, UInt64 } from 'o1js';
import { AccessPermissions, Schema, ZKDatabaseClient } from 'zkdb';
import { DB_NAME, ZKDB_URL } from '../utils/config.js';

const COLLECTION_NAME = 'my-permission-collection';
const GROUP_NAME = 'my-test-group-name';
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

  const ownership = await zkdb
    .database(DB_NAME)
    .from(COLLECTION_NAME)
    .setPermissions({
      permissionGroup: AccessPermissions.noPermissions,
    });

  console.log('ownership', ownership);

  await zkdb.authenticator.signOut();
}

await run();

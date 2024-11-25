import { CircuitString, UInt64 } from 'o1js';
import { AccessPermissions, Schema, ZKDatabaseClient } from 'zkdb';
import { DB_NAME, ZKDB_URL } from '../utils/config.js';

const COLLECTION_NAME = 'my-collection';
const GROUP_NAME = 'my-group';

class TShirt extends Schema.create({
  name: CircuitString,
  price: UInt64,
}) {}

async function run() {
  const zkdb = await ZKDatabaseClient.connect(ZKDB_URL);

  await zkdb.authenticator.signIn();

  await zkdb.database(DB_NAME).createGroup(GROUP_NAME, '');
  await zkdb
    .database(DB_NAME)
    .createCollection(
      COLLECTION_NAME,
      GROUP_NAME,
      TShirt,
      [{ name: 'name', sorting: 'desc' }],
      {
        permissionOwner: AccessPermissions.fullAdminPermissions,
        permissionGroup: AccessPermissions.fullAccessPermissions,
        permissionOther: AccessPermissions.noPermissions,
      }
    );

  console.log(
    'Index: ',
    await zkdb.database(DB_NAME).from(COLLECTION_NAME).listIndexes()
  );

  await zkdb
    .database(DB_NAME)
    .from(COLLECTION_NAME)
    .createIndexes([{ name: 'price', sorting: 'asc' }]);

  console.log(
    'Index after insert "price": ',
    await zkdb.database(DB_NAME).from(COLLECTION_NAME).listIndexes()
  );

  await zkdb.database(DB_NAME).from(COLLECTION_NAME).dropIndex('name_-1');

  console.log(
    'Index after remove drop "name": ',
    await zkdb.database(DB_NAME).from(COLLECTION_NAME).listIndexes()
  );

  zkdb.authenticator.getUser();

  await zkdb.authenticator.signOut();
}

await run();

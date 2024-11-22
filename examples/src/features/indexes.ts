import { CircuitString, NetworkId, PrivateKey, UInt64 } from 'o1js';
import {
  AccessPermissions,
  AuroWalletSigner,
  NodeSigner,
  Schema,
  ZKDatabaseClient,
} from 'zkdb';

const isBrowser = false;

const NETWORK: NetworkId = 'testnet'

const SERVER_URL = 'http://0.0.0.0:4000/graphql';

const PRIVATE_KEY = PrivateKey.fromBase58(
  'EKEGu8rTZbfWE1HWLxWtDnjt8gchvGxYM4s5q3KvNRRfdHBVe6UU'
);

const DB_NAME = 'my-db';
const COLLECTION_NAME = 'my-collection';
const GROUP_NAME = 'buyers';

class TShirt extends Schema.create({
  name: CircuitString,
  price: UInt64,
}) {}

async function run() {
  const signer = isBrowser
    ? new AuroWalletSigner()
    : new NodeSigner(PRIVATE_KEY, NETWORK);

  const zkdb = ZKDatabaseClient.newInstance(SERVER_URL, signer, new Map());

  await zkdb.authenticator.signUp('test-name', 'robot@gmail.com');

  await zkdb.authenticator.signIn();

  await zkdb
    .fromGlobal()
    .createDatabase(DB_NAME, 18);

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

  let indexes = await zkdb
    .database(DB_NAME)
    .from(COLLECTION_NAME)
    .listIndexes();
  console.log(indexes);

  await zkdb
    .database(DB_NAME)
    .from(COLLECTION_NAME)
    .createIndexes([{ name: 'price', sorting: 'asc' }]);

  indexes = await zkdb.database(DB_NAME).from(COLLECTION_NAME).listIndexes();
  console.log(indexes);

  await zkdb.database(DB_NAME).from(COLLECTION_NAME).dropIndex('name');

  indexes = await zkdb.database(DB_NAME).from(COLLECTION_NAME).listIndexes();

  console.log(indexes);

  zkdb.authenticator.getUser();

  await zkdb.authenticator.signOut();
}

await run();

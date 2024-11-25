import 'dotenv/config';
import { CircuitString, NetworkId, PrivateKey, UInt64 } from 'o1js';
import {
  AccessPermissions,
  AuroWalletSigner,
  NodeSigner,
  Schema,
  ZKDatabaseClient,
} from 'zkdb';
import { faker } from '@faker-js/faker';

const isBrowser = false;

const NETWORK = process.env.NETWORK_ID as NetworkId;
const SERVER_URL = process.env.SERVERLESS_URL || '';
const DEPLOYER_PRIVATE_KEY = process.env.DEPLOYER_PRIVATE_KEY || '';

const DB_NAME = faker.lorem.word();
console.log('🚀 ~ DB_NAME:', DB_NAME);
const COLLECTION_NAME = 'my-collection';
const GROUP_NAME = 'buyers';

class TShirt extends Schema.create({
  name: CircuitString,
  price: UInt64,
}) {}

async function run() {
  const signer = isBrowser
    ? new AuroWalletSigner()
    : new NodeSigner(PrivateKey.fromBase58(DEPLOYER_PRIVATE_KEY), NETWORK);

  const zkdb = ZKDatabaseClient.newInstance(SERVER_URL, signer, new Map());

  const fakeUser = {
    username: faker.internet.username().toLowerCase(),
    email: faker.internet.email().toLowerCase(),
  };

  // await zkdb.authenticator.signUp(fakeUser.username, fakeUser.email);

  await zkdb.authenticator.signIn();

  await zkdb.fromGlobal().createDatabase(DB_NAME, 18);

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

  // let indexes = await zkdb
  //   .database(DB_NAME)
  //   .from(COLLECTION_NAME)
  //   .listIndexes();
  // console.log(indexes);

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

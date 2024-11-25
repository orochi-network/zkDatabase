import { CircuitString, NetworkId, PrivateKey, UInt64 } from 'o1js';
import {
  AccessPermissions,
  AuroWalletSigner,
  NodeSigner,
  Schema,
  ZKDatabaseClient,
} from 'zkdb';
import { faker } from '@faker-js/faker';
import 'dotenv/config';

const isBrowser = false;

const NETWORK = process.env.NETWORK_ID as NetworkId;
const SERVER_URL = process.env.SERVERLESS_URL || '';
const DEPLOYER_PRIVATE_KEY = process.env.DEPLOYER_PRIVATE_KEY || '';

const DB_NAME = faker.lorem.word();
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

  await zkdb.authenticator.signIn();

  await zkdb.fromGlobal().createDatabase(DB_NAME, 18);

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

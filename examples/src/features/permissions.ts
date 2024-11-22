import { CircuitString, NetworkId, PrivateKey, UInt64 } from 'o1js';
import {
  AccessPermissions,
  AuroWalletSigner,
  NodeSigner,
  Schema,
  ZKDatabaseClient,
} from 'zkdb';

const isBrowser = false;

const MY_PRIVATE_KEY = PrivateKey.fromBase58(
  'EKEuWDwmwry6Nh41qJibQ1fqYokHVmc3jAc3M1PvhNQQLFLbaWq3'
);

const DB_NAME = 'my-db';
const COLLECTION_NAME = 'my-collection';
const GROUP_NAME = 'buyers';
const NETWORK: NetworkId = 'testnet'
class TShirt extends Schema.create({
  name: CircuitString,
  price: UInt64,
}) {}

const SERVER_URL = 'http://0.0.0.0:4000/graphql';

async function run() {
  const signer = isBrowser
    ? new AuroWalletSigner()
    : new NodeSigner(MY_PRIVATE_KEY, NETWORK);

  const zkdb = ZKDatabaseClient.newInstance(SERVER_URL, signer, new Map());

  await zkdb.authenticator.signUp('user-name', 'robot@gmail.com');

  await zkdb.authenticator.signIn();


  await zkdb
    .fromGlobal()
    .createDatabase(DB_NAME, 18);

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

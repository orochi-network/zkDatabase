import { CircuitString, Mina, NetworkId, PrivateKey, UInt64 } from 'o1js';
import {
  AccessPermissions,
  AuroWalletSigner,
  NodeSigner,
  Schema,
  ZKDatabaseClient,
} from 'zkdb';
import 'dotenv/config';

const isBrowser = false;

const DB_NAME = 'shop223';
const COLLECTION_NAME = 'my-collection';
const GROUP_NAME = 'buyers';

class TShirt extends Schema.create({
  name: CircuitString,
  price: UInt64,
}) {}

const MINA_ENDPOINT = process.env.NETWORK_URL || '';
const NETWORK = process.env.NETWORK_ID as NetworkId;
const SERVER_URL = process.env.SERVERLESS_URL || '';
const DEPLOYER_PRIVATE_KEY = process.env.DEPLOYER_PRIVATE_KEY || '';

async function run() {
  const Network = Mina.Network({
    networkId: NETWORK,
    mina: MINA_ENDPOINT,
  });

  Mina.setActiveInstance(Network);

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

import { CircuitString, Mina, NetworkId, PrivateKey, UInt64 } from 'o1js';
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

class TShirt extends Schema.create({
  name: CircuitString,
  price: UInt64,
}) {}

const SERVER_URL = 'http://0.0.0.0:4000/graphql';
const NETWORK: NetworkId = 'testnet';
const MINA_ENDPOINT = 'https://api.minascan.io/node/devnet/v1/graphql';

async function run() {
  const Network = Mina.Network({
    networkId: NETWORK,
    mina: MINA_ENDPOINT,
  });

  Mina.setActiveInstance(Network);

  const signer = isBrowser
    ? new AuroWalletSigner()
    : new NodeSigner(MY_PRIVATE_KEY, NETWORK);

  const zkdb = ZKDatabaseClient.newInstance(SERVER_URL, signer, new Map());

  await zkdb.authenticator.signUp('user-name', 'robot@gmail.com');

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

  await zkdb.database('my-db').fromGroup('group-name');
  await zkdb
    .database('my-db')
    .from('my-collection')
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

  const document = await collection.fetchOne({ name: 'Guchi' });

  console.log(await document?.getProofStatus());

  await zkdb.authenticator.signOut();
}

await run();

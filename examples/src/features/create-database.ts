import { assert, Mina, NetworkId, PrivateKey } from 'o1js';
import {
  AuroWalletSigner,
  NodeSigner,
  ZKDatabaseClient
} from 'zkdb';

const isBrowser = false;

const NETWORK: NetworkId = 'testnet'
const MINA_ENDPOINT = "https://api.minascan.io/node/devnet/v1/graphql"
const DB_NAME = 'shop';

const SERVER_URL = 'http://0.0.0.0:4000/graphql';

async function run() {

  const Network = Mina.Network({
    networkId: NETWORK,
    mina: MINA_ENDPOINT,
  });

Mina.setActiveInstance(Network)

const deployerPrivateKey = PrivateKey.fromBase58("Deployer private key here")

  const signer = isBrowser
    ? new AuroWalletSigner()
    : new NodeSigner(deployerPrivateKey, NETWORK);

  const zkdb = ZKDatabaseClient.newInstance(SERVER_URL, signer, new Map());

  await zkdb.authenticator.signUp('user-name', 'robot@gmail.com');

  await zkdb.authenticator.signIn();

  await zkdb
    .fromGlobal()
    .createDatabase(DB_NAME, 18);

  const databases = await zkdb
    .fromGlobal()
    .databases(
   {databaseName: DB_NAME}
    );

  assert(databases[0].databaseName === DB_NAME);

  await zkdb.authenticator.signOut();
}

await run();

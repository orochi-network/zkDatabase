import { assert, Mina, NetworkId, PrivateKey } from 'o1js';
import { AuroWalletSigner, NodeSigner, ZKDatabaseClient } from 'zkdb';
import 'dotenv/config';

const isBrowser = false;

const MINA_ENDPOINT = process.env.NETWORK_URL || '';
const NETWORK = process.env.NETWORK_ID as NetworkId;
const SERVER_URL = process.env.SERVERLESS_URL || '';
const DEPLOYER_PRIVATE_KEY = process.env.DEPLOYER_PRIVATE_KEY || '';

const DB_NAME = 'shop';

async function run() {
  const Network = Mina.Network({
    networkId: NETWORK,
    mina: MINA_ENDPOINT,
  });

  Mina.setActiveInstance(Network);

  const deployerPrivateKey = PrivateKey.fromBase58(DEPLOYER_PRIVATE_KEY);

  const signer = isBrowser
    ? new AuroWalletSigner()
    : new NodeSigner(deployerPrivateKey, NETWORK);

  const zkdb = ZKDatabaseClient.newInstance(SERVER_URL, signer, new Map());

  await zkdb.authenticator.signIn();

  await zkdb.fromGlobal().createDatabase(DB_NAME, 18);

  const databases = await zkdb
    .fromGlobal()
    .databases({ databaseName: DB_NAME });

  assert(databases[0].databaseName === DB_NAME);

  await zkdb.authenticator.signOut();
}

await run();

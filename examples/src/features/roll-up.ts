import { Mina, PrivateKey } from 'o1js';
import { Signer, NodeSigner, AuroWalletSigner, ZKDatabaseClient } from 'zkdb';

const isBrowser = false;

const MY_PRIVATE_KEY = PrivateKey.fromBase58(
  'EKEuWDwmwry6Nh41qJibQ1fqYokHVmc3jAc3M1PvhNQQLFLbaWq3'
);
const ZKDB_PRIVATE_KEY = PrivateKey.fromBase58(
  'EKF6kkkpjruMD9G1jhZLhQE2o57H22iY5qAtvsAQTV2qfXSv6mrk'
);

const DB_NAME = 'my-collection';

const SERVER_URL = 'http://0.0.0.0:4000/graphql';

async function run() {
  const Network = Mina.Network({
    mina: 'https://api.minascan.io/node/devnet/v1/graphql',
    archive: 'https://api.minascan.io/archive/devnet/v1/graphql',
  });

  Mina.setActiveInstance(Network);

  const signer = isBrowser
    ? new AuroWalletSigner()
    : new NodeSigner(MY_PRIVATE_KEY);

  const zkdb = ZKDatabaseClient.newInstance(SERVER_URL, signer, new Map());

  await zkdb.authenticator.signIn();

  const proof = await zkdb.database(DB_NAME).getProof();

  await zkdb.authenticator.signOut();
}

await run();

import { Mina, NetworkId, PrivateKey } from 'o1js';
import { AuroWalletSigner, NodeSigner, ZKDatabaseClient } from 'zkdb';

const isBrowser = false;

const MY_PRIVATE_KEY = PrivateKey.fromBase58(
  'EKEuWDwmwry6Nh41qJibQ1fqYokHVmc3jAc3M1PvhNQQLFLbaWq3'
);

const MINA_ENDPOINT = "https://api.minascan.io/node/devnet/v1/graphql"

const DB_NAME = 'my-collection';

const SERVER_URL = 'http://0.0.0.0:4000/graphql';
const NETWORK: NetworkId = 'testnet'

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

  await zkdb.authenticator.signIn();

  const proof = await zkdb.database(DB_NAME).getProof();

  await zkdb.authenticator.signOut();
}

await run();

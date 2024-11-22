import { NetworkId, PrivateKey } from 'o1js';
import { AuroWalletSigner, NodeSigner, ZKDatabaseClient } from 'zkdb';

const isBrowser = false;
const NETWORK: NetworkId = 'testnet';
const SERVER_URL = 'http://0.0.0.0:4000/graphql';

async function run() {
  const signer = isBrowser
    ? new AuroWalletSigner()
    : new NodeSigner(PrivateKey.random(), NETWORK);

  const zkdb = ZKDatabaseClient.newInstance(SERVER_URL, signer, new Map());

  await zkdb.authenticator.signUp('test-name1234', 'robot1234@gmail.com');

  await zkdb.authenticator.signIn();

  zkdb.authenticator.getUser();

  await zkdb.authenticator.signOut();
}

await run();

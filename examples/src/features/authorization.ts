import { PrivateKey } from 'o1js';
import { zkdb, Signer, NodeSigner, AuroWalletSigner } from 'zkdb';

const isBrowser = false;

const SERVER_URL = "http://0.0.0.0:4000/graphql"

async function run() {
  const signer = isBrowser
    ? new AuroWalletSigner()
    : new NodeSigner(PrivateKey.random());

  zkdb.connect(SERVER_URL, signer);

  await zkdb.auth.signUp('test-name1234', 'robot1234@gmail.com');

  await zkdb.auth.signIn();

  zkdb.auth.getUser();

  await zkdb.auth.signOut();
}

await run();

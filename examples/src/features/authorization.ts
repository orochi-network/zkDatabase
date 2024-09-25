import { PrivateKey } from 'o1js';
import { zkdb, Signer, NodeSigner, AuroWalletSigner } from 'zkdb';

const isBrowser = false;

async function run() {
  const signer = isBrowser
    ? new AuroWalletSigner()
    : new NodeSigner(PrivateKey.random());

  zkdb.connect('http://0.0.0.0:4000/graphql', signer);

  await zkdb.auth.signUp('test-name1234', 'robot1234@gmail.com');

  await zkdb.auth.signIn();

  zkdb.auth.getUser();

  await zkdb.auth.signOut();
}

await run();

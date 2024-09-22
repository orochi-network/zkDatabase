import { PrivateKey } from 'o1js';
import { zkdb, Signer, NodeSigner, AuroWalletSigner } from 'zkdb';

const isBrowser = false;

(async () => {
  let signer: Signer;

  if (isBrowser) {
    signer = new AuroWalletSigner();
  } else {
    const privateKey = PrivateKey.random();
    console.log(privateKey.toBase58()); 
    signer = new NodeSigner(privateKey);
  }

  zkdb.setSigner(signer);

  // await zkdb.auth.signUp('test-name', 'robot@gmail.com');

  await zkdb.auth.signIn();

  zkdb.auth.getUser()

  await zkdb.auth.signOut();
})();

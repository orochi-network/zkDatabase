import { PrivateKey } from 'o1js';
import { ZKDatabaseClient, Signer, NodeSigner, AuroWalletSigner } from 'zkdb';

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

  ZKDatabaseClient.setSigner(signer);

  await ZKDatabaseClient.auth().register('test-name', 'robot@gmail.com');

  await ZKDatabaseClient.auth().login('robot@gmail.com');

  await ZKDatabaseClient.auth().logOut();
})();

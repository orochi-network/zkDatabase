import { assert, Mina, PrivateKey, PublicKey } from 'o1js';
import {
  ZKDatabaseClient,
  Signer,
  NodeSigner,
  AuroWalletSigner,
  QueryBuilder,
  DatabaseSearch,
} from 'zkdb';

const isBrowser = false;

const DB_NAME = 'shop';

(async () => {
  const Local = await Mina.LocalBlockchain({ proofsEnabled: true });
  Mina.setActiveInstance(Local);

  let signer: Signer;

  const { key: deployerPrivate } = Local.testAccounts[0];

  if (isBrowser) {
    signer = new AuroWalletSigner();
  } else {
    signer = new NodeSigner(deployerPrivate);
  }

  const zkDbPrivateKey = PrivateKey.random();

  ZKDatabaseClient.setSigner(signer);

  await ZKDatabaseClient.auth().register('user-name', 'robot@gmail.com');

  await ZKDatabaseClient.auth().login('robot@gmail.com');

  const tx = await ZKDatabaseClient.context
    .minaBlockchain()
    .deployZKDatabaseSmartContract(18, zkDbPrivateKey);

 
  console.log('deployment hash', tx.hash);
  await tx.wait();

  await ZKDatabaseClient.context
    .global()
    .createDatabase(DB_NAME, 18, PublicKey.fromPrivateKey(zkDbPrivateKey));

  const databases = await ZKDatabaseClient.context
    .global()
    .databases(
      new QueryBuilder<DatabaseSearch>().where('name', 'eq', DB_NAME).build()
    );

  assert(databases[0].databaseName === DB_NAME);

  await ZKDatabaseClient.auth().logOut();
})();

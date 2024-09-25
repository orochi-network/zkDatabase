import { assert, Mina, PrivateKey, PublicKey, Sign, UInt32 } from 'o1js';
import {
  NodeSigner,
  AuroWalletSigner,
  QueryBuilder,
  DatabaseSearch,
  zkdb,
} from 'zkdb';

const isBrowser = false;

const DB_NAME = 'shop';

const SERVER_URL = 'http://0.0.0.0:4000/graphql';

async function run() {
  const Local = await Mina.LocalBlockchain({ proofsEnabled: true });
  Mina.setActiveInstance(Local);

  const { key: deployerPrivate } = Local.testAccounts[0];

  const signer = isBrowser
    ? new AuroWalletSigner()
    : new NodeSigner(deployerPrivate);

  zkdb.connect(SERVER_URL, signer);
  
  const zkDbPrivateKey = PrivateKey.random();

  await zkdb.auth.signUp('user-name', 'robot@gmail.com');

  await zkdb.auth.signIn();

  const tx = await zkdb
    .fromBlockchain()
    .deployZKDatabaseSmartContract(18, zkDbPrivateKey);

  await tx.wait();

  await zkdb
    .fromGlobal()
    .createDatabase(DB_NAME, 18, PublicKey.fromPrivateKey(zkDbPrivateKey));

  const databases = await zkdb
    .fromGlobal()
    .databases(
      new QueryBuilder<DatabaseSearch>().where('name', 'eq', DB_NAME).build()
    );

  assert(databases[0].databaseName === DB_NAME);

  await zkdb.auth.signOut();
}

await run();

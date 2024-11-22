import { Mina, NetworkId } from 'o1js';
import { AuroWalletSigner, NodeSigner, ZKDatabaseClient } from 'zkdb';

const isBrowser = false;

const network: NetworkId = 'testnet';
const MINA_DECIMAL = 1e9;
const DB_NAME = 'shop';

const SERVER_URL = 'http://0.0.0.0:4000/graphql';

async function run() {
  const Local = await Mina.LocalBlockchain({ proofsEnabled: true });
  Mina.setActiveInstance(Local);

  const { key: deployerPrivate } = Local.testAccounts[0];

  const signer = isBrowser
    ? new AuroWalletSigner()
    : new NodeSigner(deployerPrivate, network);

  const zkdb = ZKDatabaseClient.newInstance(SERVER_URL, signer, new Map());

  await zkdb.authenticator.signUp('user-name', 'robot@gmail.com');

  await zkdb.authenticator.signIn();
  // The transaction will be created in background after database created
  // Get unsigned transaction
  const { tx, id } = await zkdb.database(DB_NAME).getTransaction('deploy');
  // Signed the transaction
  const txHash = await signer.signAndSendTransaction(tx, {
    fee: MINA_DECIMAL,
    memo: '',
  });
  // Confirm the transaction
  await zkdb.database(DB_NAME).confirmTransaction(id, txHash);

  await zkdb.authenticator.signOut();
}

await run();

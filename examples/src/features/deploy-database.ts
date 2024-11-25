import { Mina, NetworkId, PrivateKey } from 'o1js';
import { AuroWalletSigner, NodeSigner, ZKDatabaseClient } from 'zkdb';
import 'dotenv/config';

const isBrowser = false;

const MINA_DECIMAL = 1e9;
const DB_NAME = 'shop';

const MINA_ENDPOINT = process.env.NETWORK_URL || '';
const NETWORK = process.env.NETWORK_ID as NetworkId;
const SERVER_URL = process.env.SERVERLESS_URL || '';
const DEPLOYER_PRIVATE_KEY = process.env.DEPLOYER_PRIVATE_KEY || '';

async function run() {
  const Network = Mina.Network({
    networkId: NETWORK,
    mina: MINA_ENDPOINT,
  });

  Mina.setActiveInstance(Network);

  const deployerPrivateKey = PrivateKey.fromBase58(DEPLOYER_PRIVATE_KEY);

  const signer = isBrowser
    ? new AuroWalletSigner()
    : new NodeSigner(deployerPrivateKey, NETWORK);

  const zkdb = ZKDatabaseClient.newInstance(SERVER_URL, signer, new Map());

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

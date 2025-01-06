import { Mina } from 'o1js';
import { ZkDatabaseClient } from 'zkdb';
import { DB_NAME, ZKDB_URL } from '../utils/config.js';

const MINA_DECIMAL = 1e9;

async function run() {
  // This is On-chain action. Need to set Mina network
  const zkdb = await ZkDatabaseClient.connect(ZKDB_URL);

  const Network = Mina.Network({
    networkId: zkdb.minaConfig.networkId,
    mina: zkdb.minaConfig.networkUrl,
  });

  Mina.setActiveInstance(Network);

  await zkdb.authenticator.signIn();
  // The transaction will be created in background after database created
  // Get unsigned transaction
  const { tx, id } = await zkdb.db(DB_NAME).getTransaction('deploy');
  // Signed the transaction
  const txHash = await zkdb.getSigner().signAndSendTransaction(tx, {
    fee: MINA_DECIMAL,
    memo: '',
  });
  // Confirm the transaction
  await zkdb.db(DB_NAME).confirmTransaction(id, txHash);

  await zkdb.authenticator.signOut();
}

await run();

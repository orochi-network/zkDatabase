import { Mina } from 'o1js';
import { ZkDatabaseClient } from 'zkdb';
import { DB_NAME, ZKDB_URL } from '../utils/config.js';

const MINA_DECIMAL = 1e9;

async function run() {
  // This is On-chain action. Need to set Mina network
  const zkdb = await ZkDatabaseClient.connect(ZKDB_URL);

  await zkdb.authenticator.signIn();

  const Network = Mina.Network({
    networkId: zkdb.minaConfig.networkId,
    mina: zkdb.minaConfig.networkUrl,
  });

  Mina.setActiveInstance(Network);

  const history = await zkdb.db(DB_NAME).getRollupHistory();

  if (history.state === 'outdated') {
    // Create a rollup, this time will take time in background so need to write a polling function
    await zkdb.db(DB_NAME).createRollup();
  }

  const { tx, id } = await zkdb.db(DB_NAME).getTransaction('rollup');

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

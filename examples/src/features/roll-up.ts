import { Mina } from 'o1js';
import { DB_NAME, ZKDB_URL } from '../utils/config.js';
import { ZkDatabase } from 'zkdb';
import { ERollupState, ETransactionType } from '@zkdb/common';

const MINA_DECIMAL = 1e9;

async function run() {
  // This is On-chain action. Need to set Mina network
  const zkdb = await ZkDatabase.connect(ZKDB_URL);

  await zkdb.authenticator.signIn();

  const Network = Mina.Network({
    networkId: zkdb.minaConfig.networkId,
    mina: zkdb.minaConfig.networkUrl,
  });

  Mina.setActiveInstance(Network);

  const history = await zkdb.db(DB_NAME).rollUpHistory();

  if (history?.rollUpState === ERollupState.Outdated) {
    // Create a rollup, this time will take time in background so need to write a polling function
    await zkdb.db(DB_NAME).rollUpOnChainStart();
  }

  const draftTransaction = await zkdb
    .db(DB_NAME)
    .transactionDraft(ETransactionType.Rollup)
    .then((tx) => {
      if (tx === null) {
        throw new Error('No transaction draft found');
      }

      return tx;
    });

  if (draftTransaction.txHash === null) {
    throw new Error('No transaction hash');
  }

  // Signed the transaction
  const txHash = await zkdb
    .getSigner()
    .signAndSendTransaction(draftTransaction.txHash, {
      fee: MINA_DECIMAL,
      memo: '',
    });

  // Confirm the transaction
  await zkdb.db(DB_NAME).transactionSubmit(draftTransaction._id, txHash);

  await zkdb.authenticator.signOut();
}

await run();

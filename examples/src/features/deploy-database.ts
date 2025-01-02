import { Mina } from 'o1js';
import { ZKDatabase } from 'zkdb';
import { DB_NAME, ZKDB_URL } from '../utils/config.js';
import { ETransactionType } from '@zkdb/common';

const MINA_DECIMAL = 1e9;

async function run() {
  // This is On-chain action. Need to set Mina network
  const zkdb = await ZKDatabase.connect(ZKDB_URL);

  const Network = Mina.Network({
    networkId: zkdb.minaConfig.networkId,
    mina: zkdb.minaConfig.networkUrl,
  });

  Mina.setActiveInstance(Network);

  await zkdb.authenticator.signIn();

  // The transaction will be created in background after database created
  // Get unsigned transaction
  const draftTransaction = await zkdb
    .db(DB_NAME)
    .transactionDraft(ETransactionType.Deploy);

  if (draftTransaction === null) {
    throw new Error('No transaction draft');
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

import {
  Mina,
  PrivateKey,
  AccountUpdate,
  UInt32,
  CircuitString,
  UInt64,
  Provable
} from 'o1js';
import { User } from './user.js';
import { ZKDatabaseStorage } from '../../core/zkdb-storage.js';
import { DatabaseContract } from '../../core/database-contract.js';
import { RollupService } from '../../rollup/rollup-service.js';
import { Credentials } from '../../models/credentials.js';

let doProofs = false;

const merkleHeight = 8;

(async () => {
  let Local = Mina.LocalBlockchain({ proofsEnabled: doProofs });
  Mina.setActiveInstance(Local);
  let initialBalance = 10_000_000_000;

  let feePayerKey = Local.testAccounts[0].privateKey;
  let feePayer = Local.testAccounts[0].publicKey;

  // the zkapp account
  let zkappKey = PrivateKey.random();
  let zkappAddress = zkappKey.toPublicKey();

  // Initialize offchain service

  const zkdb = await ZKDatabaseStorage.getInstance('zkdb-test', {
    storageEngine: 'local',
    merkleHeight,
    storageEngineCfg: {
      location: './data',
    },
  });

  const offchainContract = new DatabaseContract(zkappAddress);
  const rollUpService = await RollupService.activate(offchainContract, zkdb, new Credentials(feePayerKey, zkappKey));

  if (doProofs) {
    await DatabaseContract.compile();
  }

  console.log('Deploying Database Smart Contract...');
  let tx = await Mina.transaction(feePayer, () => {
    AccountUpdate.fundNewAccount(feePayer).send({
      to: zkappAddress,
      amount: initialBalance,
    });
    offchainContract.deploy();
  });
  await tx.prove();
  await tx.sign([feePayerKey, zkappKey]).send();

  Provable.log('on chain commitment', offchainContract.getState());
  Provable.log('off chain commitment', await zkdb.getMerkleRoot());

  // Feed
  console.log('Update Database Smart Contract...');
  for (let i = 0; i < 2; i++) {
    const newUser = new User({
      accountName: CircuitString.fromString(`user ${i}`),
      ticketAmount: UInt32.from(i),
    });

    
    console.log(`Saving user ${i}`);
    const index = await zkdb.add(newUser);

    const tx = await Mina.transaction(feePayer, () => {
      offchainContract.insert(UInt64.from(index), newUser.hash());
    });

    await tx.prove();
    await tx.sign([feePayerKey, zkappKey,]).send();
  }

  const batchSize = 5;
  await rollUpService.rollUp(batchSize);

  Provable.log('on chain commitment', offchainContract.getState());
  Provable.log('off chain commitment', await zkdb.getMerkleRoot());
})();

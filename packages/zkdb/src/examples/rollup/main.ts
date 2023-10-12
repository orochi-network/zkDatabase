import {
  Mina,
  PrivateKey,
  AccountUpdate,
  UInt32,
  CircuitString,
  UInt64,
  Provable
} from 'o1js';
import {
  OffchainRollUp, RollUpProof,
} from '../../roll-up/offchain-rollup.js';
import { RollUpInput } from '../../roll-up/rollup-params.js';
import { User } from './user.js';
import { ZKDatabaseStorage } from '../../core/zkdb-storage.js';
import { DatabaseContract } from './database-contract.js';
import { DatabaseMerkleWitness } from '../../core/database-witness.js';
import { initZKDatabase } from './database-contract.js';

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

  const provedMerkleTree = zkdb.getMerkleTree();

  initZKDatabase(await zkdb.getMerkleRoot());

  const offchainContract = new DatabaseContract(zkappAddress);

  if (doProofs) {
    await DatabaseContract.compile();
  }

  console.log('OffchainRollUp.analyzeMethods()');
  OffchainRollUp.analyzeMethods();

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
      offchainContract.insert(UInt64.from(index), newUser);
    });

    await tx.prove();
    await tx.sign([feePayerKey, zkappKey,]).send();
  }

  const batchSize = 5;

  console.log('Roll Up');
  const currentActionState = offchainContract.getActionState();
  const merkleRoot = offchainContract.getState();

  const actions = await offchainContract.getUnprocessedActions(batchSize);

  const rollUpInput = new RollUpInput(
    {
      onChainActionState: currentActionState,
      onChainRoot: merkleRoot
    }
  );

  console.log('OffchainRollUp Compiling...');

  const { verificationKey } = await OffchainRollUp.compile();

  Provable.log('merkle tree', provedMerkleTree)

  let proof: RollUpProof | undefined = undefined;

  const depth = batchSize > actions.length ? actions.length : batchSize;

  console.log('Recursion')
  for (let i = 0; i < depth; i++) {
    console.log(`depth : ${i}`)
    const action = actions[i];
    const oldLeaf = provedMerkleTree.getNode(0, action.index.toBigInt());
    const witness = new DatabaseMerkleWitness(provedMerkleTree.getWitness(action.index.toBigInt()));

    if (i === 0) {
      console.log('init')
      proof = await OffchainRollUp.init(rollUpInput, oldLeaf, action, witness);
    } else {
      console.log('update')
      proof = await OffchainRollUp.update(rollUpInput, proof!, oldLeaf, action, witness);
    }

    provedMerkleTree.setLeaf(action.index.toBigInt(), action.hash);
  }

  if (proof !== undefined) {
    const tx = await Mina.transaction(feePayer, () => {
      offchainContract.rollup(proof!);
    });

    await tx.prove();
    await tx.sign([feePayerKey, zkappKey,]).send();
  }

  Provable.log('on chain commitment', offchainContract.getState());
  Provable.log('off chain commitment', await zkdb.getMerkleRoot());
})();

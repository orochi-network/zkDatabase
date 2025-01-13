import {
  AccountUpdate,
  Field,
  MerkleTree,
  Mina,
  Poseidon,
  PrivateKey,
  verify,
} from 'o1js';
import { ZkDbProcessor } from './zkdb-processor.js';

// Enable this to generate proofs
const doProofs = false;

// Height of the Merkle Tree
const merkleHeight = 64;

const Local = await Mina.LocalBlockchain({ proofsEnabled: doProofs });
Mina.setActiveInstance(Local);
const initialBalance = 1_000_000_000;

const feePayerKey = Local.testAccounts[0].key;
const feePayer = Local.testAccounts[0];

// the zkapp account
const zkappKey = PrivateKey.random();
const zkappAddress = zkappKey.toPublicKey();

ZkDbProcessor.setLogger(console);

const processor = await ZkDbProcessor.getInstance(merkleHeight);

const merkleTree = new MerkleTree(merkleHeight);

const zkApp = processor.getInstanceZkDBContract(zkappAddress);

// Fund new account
const tx = await Mina.transaction(feePayer, async () => {
  await AccountUpdate.fundNewAccount(feePayer).send({
    to: zkappAddress,
    amount: initialBalance,
  });
  await zkApp.deploy();
});

await tx.prove();
await tx.sign([feePayerKey, zkappKey]).send();

console.log(
  'Check the on-chain state of the zkApp:',
  zkApp.merkleRoot.get().toString()
);

console.log('Initial root off-chain:', merkleTree.getRoot().toString());

const proof1 = await processor.init(
  merkleTree.getRoot(),
  merkleTree.getWitness(0n)
);

merkleTree.setLeaf(1n, Field(3n));

const proof2 = await processor.update(proof1, {
  merkleRootNew: merkleTree.getRoot(),
  merkleProof: merkleTree.getWitness(1n),
  leafOld: Field(0n),
  leafNew: Field(3n),
});

merkleTree.setLeaf(2n, Field(5n));

const serializedProof2 = processor.serialize(proof2);

console.log('Proof2>', serializedProof2);

const deserializeProof2 = await processor.deserialize(
  JSON.stringify(serializedProof2)
);

console.log('Verify generic proof');
console.log('>>>', await verify(serializedProof2.proof, processor.vkRollup));

const proof3 = await processor.update(deserializeProof2, {
  merkleRootNew: merkleTree.getRoot(),
  merkleProof: merkleTree.getWitness(2n),
  leafOld: Field(0n),
  leafNew: Field(5n),
});

// Perform the transaction
let tx2 = await Mina.transaction(feePayer, async () => {
  await zkApp.rollUp(proof3.proof);
});
await tx2.prove();
await tx2.sign([feePayerKey, zkappKey]).send();

console.log('On-chain state:', zkApp.merkleRoot.get().toString());
console.log(
  'Check the rollup state of the proof:',
  proof3.proof.publicOutput.merkleRoot.toString()
);

merkleTree.setLeaf(2n, Field(7n));

const proof4 = await processor.update(proof3, {
  merkleRootNew: merkleTree.getRoot(),
  merkleProof: merkleTree.getWitness(2n),
  leafOld: Field(5n),
  leafNew: Field(7n),
});

// Perform the transaction
/*
let tx3 = await Mina.transaction(feePayer, async () => {
  await zkApp.rollUp(proof4.proof);
});
await tx3.prove();
await tx3.sign([feePayerKey, zkappKey]).send();
*/
console.log('On-chain state:', zkApp.merkleRoot.get().toString());
console.log(
  'Check the rollup state of the proof:',
  proof4.proof.publicOutput.merkleRoot.toString()
);

console.log('Onchain step:', zkApp.step.get().toString());

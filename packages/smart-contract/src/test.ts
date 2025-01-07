import {
  AccountUpdate,
  CircuitString,
  Field,
  MerkleTree,
  MerkleWitness,
  Mina,
  Poseidon,
  PrivateKey,
  Struct,
  UInt32,
} from 'o1js';
import { ZkDbContractFactory } from './zkdb-contract.js';
import { ZkDbRollupInput, ZkDbRollupFactory } from './zkdb-rollup.js';

// Enable this to generate proofs
const doProofs = false;

// Height of the Merkle Tree
const merkleHeight = 3;

// Extend Merkle witness at the same height as the Merkle Tree
class MyMerkleWitness extends MerkleWitness(merkleHeight) {}

const Local = await Mina.LocalBlockchain({ proofsEnabled: doProofs });
Mina.setActiveInstance(Local);
const initialBalance = 100_000_000_000;

const feePayerKey = Local.testAccounts[0].key;
const feePayer = Local.testAccounts[0];

// the zkapp account
const zkappKey = PrivateKey.random();
const zkappAddress = zkappKey.toPublicKey();

const zkDBRollup = ZkDbRollupFactory(merkleHeight);

await zkDBRollup.compile();

const zkDBContract = ZkDbContractFactory(merkleHeight, zkDBRollup);

await zkDBContract.compile();

const merkleTree = new MerkleTree(merkleHeight);
const root1 = await merkleTree.getRoot();
console.log('Initial root:', root1.toString());

const zkApp = new zkDBContract(zkappAddress);

if (doProofs) {
  await zkDBContract.compile();
}

function H(l: Field, r: Field): Field {
  return Poseidon.hash([l, r]);
}

console.log('>>>', H(H(Field(0), Field(0)), H(Field(0), Field(0))).toString());

const root = H(
  H(H(Field(0), Field(1)), H(Field(2), Field(0))),
  H(H(Field(0), Field(0)), H(Field(0), Field(0)))
).toString();

console.log(root.toString());

const tx = await Mina.transaction(feePayer, async () => {
  AccountUpdate.fundNewAccount(feePayer).send({
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

console.log(merkleTree.getWitness(0n));

const proof1 = await zkDBRollup.init(
  new ZkDbRollupInput({
    step: Field(0),
    merkleRootNew: root1,
    merkleRootOld: root1,
  }),
  new MyMerkleWitness(merkleTree.getWitness(0n))
);

console.log(
  'Check the rollup state of the proof:',
  proof1.proof.publicOutput.merkleRoot.toString()
);

merkleTree.setLeaf(1n, Field(1n));
const root2 = merkleTree.getRoot();
console.log('Prove root2:', root2.toString());
const proof2 = await zkDBRollup.update(
  new ZkDbRollupInput({
    step: Field(1),
    merkleRootNew: root2,
    merkleRootOld: root1,
  }),
  proof1.proof,
  new MyMerkleWitness(merkleTree.getWitness(1n)),
  Field(0n),
  Field(1n)
);

merkleTree.setLeaf(2n, Field(2n));
const root3 = merkleTree.getRoot();

console.log(proof2);

const proof3 = await zkDBRollup.update(
  new ZkDbRollupInput({
    step: Field(2),
    merkleRootNew: root3,
    merkleRootOld: root2,
  }),
  proof2.proof,
  new MyMerkleWitness(merkleTree.getWitness(2n)),
  Field(0n),
  Field(2n)
);

// Perform the transaction
let tx2 = await Mina.transaction(feePayer, async () => {
  zkApp.rollUp(proof3.proof);
});
await tx2.prove();
await tx2.sign([feePayerKey, zkappKey]).send();

console.log('On-chain state:', zkApp.merkleRoot.get().toString());
console.log('Check the rollup state of the proof:', root3.toString());

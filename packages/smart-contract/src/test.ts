import {
  fetchAccount,
  Field,
  MerkleTree,
  MerkleWitness,
  Mina,
  PrivateKey,
  Provable,
  PublicKey,
} from 'o1js';
import { ZKDatabaseSmartContractWrapper } from './contracts/zkdb-app-wrapper';
import { ProofStateInput, RollUpProgram } from '@proof';

const MERKLE_HEIGHT = 18;

class DatabaseMerkleWitness extends MerkleWitness(MERKLE_HEIGHT) {}

export async function runTest() {
  const merkleTree = new MerkleTree(MERKLE_HEIGHT);

  const zeroRoot = merkleTree.getRoot();

  Provable.log('zeroRoot', zeroRoot);
  const leaf1 = Field(1);
  const leaf2 = Field(2);
  const leaf3 = Field(3);
  const leaf4 = Field(4);
  const leaf5 = Field(5);

  // merkleTree.setLeaf(0n, leaf1);

  // const witness = new DatabaseMerkleWitness(merkleTree.getWitness(0n));

  // Provable.log(witness.calculateRoot(Field(0)))

  const Local = await Mina.LocalBlockchain({ proofsEnabled: true });
  Mina.setActiveInstance(Local);

  const bobKey = Local.testAccounts[0].key;
  const bobPk = PublicKey.fromPrivateKey(bobKey);

  const zkAppKey = PrivateKey.random();
  const zkAppPublic = PublicKey.fromPrivateKey(zkAppKey);

  const rollUp = RollUpProgram(MERKLE_HEIGHT);

  const zkAppWrapper = ZKDatabaseSmartContractWrapper.testConstructor(
    MERKLE_HEIGHT,
    rollUp
  );

  await zkAppWrapper.compile();

  const deployTx = await zkAppWrapper.createAndProveDeployTransaction({
    sender: bobPk,
    zkApp: zkAppPublic,
  });

  await deployTx.prove();

  await deployTx.sign([bobKey, zkAppKey]).send();

  const zkAppAccount = Mina.getAccount(zkAppPublic);

  Provable.log('zkAppAccount', zkAppAccount.zkapp?.appState);
  Provable.log('firstRoot', zkAppAccount.zkapp?.appState);

  merkleTree.setLeaf(0n, leaf1);

  const firstRoot = merkleTree.getRoot();

  let input = new ProofStateInput({
    previousOnChainState: Field(0),
    currentOnChainState: zeroRoot,
    currentOffChainState: zeroRoot,
  });

  console.log('proof init');

  let proof = await rollUp.init(
    input,
    new DatabaseMerkleWitness(merkleTree.getWitness(0n)),
    Field(0),
    Field(1)
  );

  const rollUpTx = await zkAppWrapper.createAndProveRollUpTransaction(
    {
      sender: bobPk,
      zkApp: zkAppPublic,
    },
    proof.toJSON()
  );

  await rollUpTx.prove();

  let pending = await rollUpTx.sign([bobKey, zkAppKey]).send();

  await pending.wait();

  merkleTree.setLeaf(1n, leaf2);

  const secondRoot = merkleTree.getRoot();

  input = new ProofStateInput({
    previousOnChainState: zeroRoot,
    currentOnChainState: firstRoot,
    currentOffChainState: firstRoot,
  });

  console.log('proof 2');
  proof = await rollUp.updateTransition(
    input,
    proof,
    proof,
    new DatabaseMerkleWitness(merkleTree.getWitness(1n)),
    Field(0),
    Field(2)
  );

  console.log('send proof 2')
  const rollUpTx2 = await zkAppWrapper.createAndProveRollUpTransaction(
    {
      sender: bobPk,
      zkApp: zkAppPublic,
    },
    proof.toJSON()
  );

  await rollUpTx2.prove();

  pending = await rollUpTx2.sign([bobKey, zkAppKey]).send();

  await pending.wait();

  merkleTree.setLeaf(2n, leaf3);

  input = new ProofStateInput({
    previousOnChainState: firstRoot,
    currentOnChainState: secondRoot,
    currentOffChainState: secondRoot,
  });

  const thirdRoot = merkleTree.getRoot();

  proof = await rollUp.updateTransition(
    input,
    proof,
    proof,
    new DatabaseMerkleWitness(merkleTree.getWitness(2n)),
    Field(0),
    Field(3)
  );

  console.log('send proof 3')

  merkleTree.setLeaf(3n, leaf4);

  input = new ProofStateInput({
    previousOnChainState: firstRoot,
    currentOnChainState: secondRoot,
    currentOffChainState: thirdRoot,
  });

  proof = await rollUp.update(
    input,
    proof,
    new DatabaseMerkleWitness(merkleTree.getWitness(3n)),
    Field(0),
    Field(4)
  );


  const rollUpTx3 = await zkAppWrapper.createAndProveRollUpTransaction(
    {
      sender: bobPk,
      zkApp: zkAppPublic,
    },
    proof.toJSON()
  );

  await rollUpTx3.prove();

  await rollUpTx3.sign([bobKey, zkAppKey]).send();

  merkleTree.setLeaf(4n, leaf5);

  const forthRoot = merkleTree.getRoot();

  input = new ProofStateInput({
    previousOnChainState: secondRoot,
    currentOnChainState: thirdRoot,
    currentOffChainState: forthRoot,
  });

  proof = await rollUp.updateTransition(
    input,
    proof,
    proof,
    new DatabaseMerkleWitness(merkleTree.getWitness(4n)),
    Field(0),
    Field(5)
  );


  const rollUpTx4 = await zkAppWrapper.createAndProveRollUpTransaction(
    {
      sender: bobPk,
      zkApp: zkAppPublic,
    },
    proof.toJSON()
  );

  await rollUpTx4.prove();

  await rollUpTx4.sign([bobKey, zkAppKey]).send();

  // console.log('send proof 4')

  // const rollUpTx4 = await zkAppWrapper.createAndProveRollUpTransaction(
  //   {
  //     sender: bobPk,
  //     zkApp: zkAppPublic,
  //   },
  //   proof.toJSON()
  // );

  // await rollUpTx4.prove();

  // await rollUpTx4.sign([bobKey, zkAppKey]).send();
}

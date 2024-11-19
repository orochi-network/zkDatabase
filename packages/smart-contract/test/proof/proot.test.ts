import {
  Field,
  MerkleTree,
  MerkleWitness,
  Mina,
  Poseidon,
  PrivateKey,
  PublicKey,
} from 'o1js';
import {
  DatabaseRollUp,
  RollUpProgram,
} from '../../src/proof/proof-program.js';
import { ZKDatabaseSmartContractWrapper } from '../../src/contracts/zkdb-app-wrapper.js';
import { ProofStateInput } from '../../src/proof/proof-state.js';

const MERKLE_HEIGHT = 12;

class DatabaseMerkleWitness extends MerkleWitness(MERKLE_HEIGHT) {}

describe('RollUpProgram', () => {
  let rollUp: DatabaseRollUp;
  let zkAppWrapper: ZKDatabaseSmartContractWrapper;
  let bobPk: PublicKey;
  let bobKey: PrivateKey;
  let zkAppPublic: PublicKey;
  let zkAppKey: PrivateKey;

  beforeAll(async () => {
    const Local = await Mina.LocalBlockchain({ proofsEnabled: true });
    Mina.setActiveInstance(Local);

    rollUp = RollUpProgram(MERKLE_HEIGHT);

    zkAppWrapper = ZKDatabaseSmartContractWrapper.testConstructor(
      MERKLE_HEIGHT,
      rollUp
    );

    await zkAppWrapper.compile();
    bobKey = Local.testAccounts[0].key;
    bobPk = PublicKey.fromPrivateKey(bobKey);
  });

  beforeEach(async () => {
    zkAppKey = PrivateKey.random();
    zkAppPublic = PublicKey.fromPrivateKey(zkAppKey);

    const deployTx = await zkAppWrapper.createAndProveDeployTransaction({
      sender: bobPk,
      zkApp: zkAppPublic,
    });

    await deployTx.prove();

    await deployTx.sign([bobKey, zkAppKey]).send();
  });

  it('genesis rollup', async () => {
    const merkleTree = new MerkleTree(MERKLE_HEIGHT);
    const zeroRoot = merkleTree.getRoot();

    merkleTree.setLeaf(0n, Field(1));

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

    const zkAppAccount = Mina.getAccount(zkAppPublic);

    expect(zkAppAccount.zkapp?.appState[0]).toEqual(firstRoot);
  });

  it('genesis rollup + transaction rollup + regular rollup', async () => {
    const firstLeaf = Field(1);
    const secondLeaf = Field(2);
    const thirdLeaf = Field(3);

    const merkleTree = new MerkleTree(MERKLE_HEIGHT);
    const zeroRoot = merkleTree.getRoot();

    merkleTree.setLeaf(0n, firstLeaf);

    const firstRoot = merkleTree.getRoot();

    let input = new ProofStateInput({
      previousOnChainState: Field(0),
      currentOnChainState: zeroRoot,
      currentOffChainState: zeroRoot,
    });

    let proof = await rollUp.init(
      input,
      new DatabaseMerkleWitness(merkleTree.getWitness(0n)),
      Field(0),
      firstLeaf
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

    //
    merkleTree.setLeaf(1n, secondLeaf);

    const secondRoot = merkleTree.getRoot();

    input = new ProofStateInput({
      previousOnChainState: zeroRoot,
      currentOnChainState: firstRoot,
      currentOffChainState: firstRoot,
    });

    proof = await rollUp.updateTransition(
      input,
      proof,
      proof,
      new DatabaseMerkleWitness(merkleTree.getWitness(1n)),
      Field(0),
      secondLeaf
    );

    merkleTree.setLeaf(2n, thirdLeaf);

    input = new ProofStateInput({
      previousOnChainState: zeroRoot,
      currentOnChainState: firstRoot,
      currentOffChainState: secondRoot,
    });
  
    proof = await rollUp.update(
      input,
      proof,
      new DatabaseMerkleWitness(merkleTree.getWitness(2n)),
      Field(0),
      thirdLeaf
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
  });

  it('genesis rollup + transaction rollup + transaction rollup', async () => {
    const firstLeaf = Field(1);
    const secondLeaf = Field(2);
    const thirdLeaf = Field(3);

    const merkleTree = new MerkleTree(MERKLE_HEIGHT);
    const zeroRoot = merkleTree.getRoot();

    merkleTree.setLeaf(0n, firstLeaf);

    const firstRoot = merkleTree.getRoot();

    let input = new ProofStateInput({
      previousOnChainState: Field(0),
      currentOnChainState: zeroRoot,
      currentOffChainState: zeroRoot,
    });

    let proof = await rollUp.init(
      input,
      new DatabaseMerkleWitness(merkleTree.getWitness(0n)),
      Field(0),
      firstLeaf
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

    //
    merkleTree.setLeaf(1n, secondLeaf);

    const secondRoot = merkleTree.getRoot();

    input = new ProofStateInput({
      previousOnChainState: zeroRoot,
      currentOnChainState: firstRoot,
      currentOffChainState: firstRoot,
    });

    proof = await rollUp.updateTransition(
      input,
      proof,
      proof,
      new DatabaseMerkleWitness(merkleTree.getWitness(1n)),
      Field(0),
      secondLeaf
    );

    const rollUpTx2 = await zkAppWrapper.createAndProveRollUpTransaction(
      {
        sender: bobPk,
        zkApp: zkAppPublic,
      },
      proof.toJSON()
    );
  
    await rollUpTx2.prove();
  
    await rollUpTx2.sign([bobKey, zkAppKey]).send();

    merkleTree.setLeaf(2n, thirdLeaf);

    input = new ProofStateInput({
      previousOnChainState: firstRoot,
      currentOnChainState: secondRoot,
      currentOffChainState: secondRoot,
    });
  
    proof = await rollUp.updateTransition(
      input,
      proof,
      proof,
      new DatabaseMerkleWitness(merkleTree.getWitness(2n)),
      Field(0),
      thirdLeaf
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
  });
});

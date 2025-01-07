import {
  Field,
  MerkleTree,
  MerkleWitness,
  Mina,
  Poseidon,
  PrivateKey,
  Proof,
  Provable,
  PublicKey,
} from 'o1js';
import {
  DatabaseRollup,
  RollupProgram,
} from '../../src/proof/proof-program.js';
import { ZkDatabaseSmartContractWrapper } from '../../src/contracts/zkdb-app-wrapper.js';
import {
  ZkDatabaseStateInput,
  ZkDatabaseStateOutput,
} from '../../src/proof/proof-state.js';

async function genesisUpdate(
  input: ZkDatabaseStateInput,
  previousLeaf: Field,
  newLeaf: Field,
  merkleTree: MerkleTree,
  rollUp: DatabaseRollup,
  zkAppWrapper?: ZkDatabaseSmartContractWrapper,
  userPrivateKey?: PrivateKey,
  zkAppPrivateKey?: PrivateKey
) {
  const proof = await rollUp.init(
    input,
    new DatabaseMerkleWitness(merkleTree.getWitness(0n)),
    previousLeaf,
    newLeaf
  );

  if (zkAppWrapper) {
    const rollUpTx = await zkAppWrapper.createAndProveRollupTransaction(
      {
        sender: userPrivateKey!.toPublicKey(),
        zkApp: zkAppPrivateKey!.toPublicKey(),
      },
      proof.toJSON()
    );

    await rollUpTx.prove();

    let pending = await rollUpTx
      .sign([userPrivateKey!, zkAppPrivateKey!])
      .send();

    await pending.wait();
  }

  return proof;
}

async function regularUpdate(
  input: ZkDatabaseStateInput,
  previousProof: Proof<ZkDatabaseStateInput, ZkDatabaseStateOutput>,
  merkleIndex: bigint,
  previousLeaf: Field,
  newLeaf: Field,
  merkleTree: MerkleTree,
  rollUp: DatabaseRollup,
  zkAppWrapper?: ZkDatabaseSmartContractWrapper,
  userPrivateKey?: PrivateKey,
  zkAppPrivateKey?: PrivateKey
) {
  const proof = await rollUp.update(
    input,
    previousProof,
    new DatabaseMerkleWitness(merkleTree.getWitness(merkleIndex)),
    previousLeaf,
    newLeaf
  );

  if (zkAppWrapper) {
    const rollUpTx = await zkAppWrapper.createAndProveRollupTransaction(
      {
        sender: userPrivateKey!.toPublicKey(),
        zkApp: zkAppPrivateKey!.toPublicKey(),
      },
      proof.toJSON()
    );

    await rollUpTx.prove();

    let pending = await rollUpTx
      .sign([userPrivateKey!, zkAppPrivateKey!])
      .send();

    await pending.wait();
  }

  return proof;
}

async function transactionUpdate(
  input: ZkDatabaseStateInput,
  previousProof: Proof<ZkDatabaseStateInput, ZkDatabaseStateOutput>,
  rollUpProof: Proof<ZkDatabaseStateInput, ZkDatabaseStateOutput>,
  merkleIndex: bigint,
  previousLeaf: Field,
  newLeaf: Field,
  merkleTree: MerkleTree,
  rollUp: DatabaseRollup,
  zkAppWrapper?: ZkDatabaseSmartContractWrapper,
  userPrivateKey?: PrivateKey,
  zkAppPrivateKey?: PrivateKey
) {
  const proof = await rollUp.updateTransition(
    input,
    rollUpProof,
    previousProof,
    new DatabaseMerkleWitness(merkleTree.getWitness(merkleIndex)),
    previousLeaf,
    newLeaf
  );

  if (zkAppWrapper) {
    const rollUpTx = await zkAppWrapper.createAndProveRollupTransaction(
      {
        sender: userPrivateKey!.toPublicKey(),
        zkApp: zkAppPrivateKey!.toPublicKey(),
      },
      proof.toJSON()
    );

    await rollUpTx.prove();

    let pending = await rollUpTx
      .sign([userPrivateKey!, zkAppPrivateKey!])
      .send();

    await pending.wait();
  }

  return proof;
}

const MERKLE_HEIGHT = 12;

class DatabaseMerkleWitness extends MerkleWitness(MERKLE_HEIGHT) {}

describe('RollupProgram', () => {
  let rollUp: DatabaseRollup;
  let zkAppWrapper: ZkDatabaseSmartContractWrapper;
  let bobPk: PublicKey;
  let bobKey: PrivateKey;
  let zkAppPublic: PublicKey;
  let zkAppKey: PrivateKey;

  beforeAll(async () => {
    const Local = await Mina.LocalBlockchain({ proofsEnabled: true });
    Mina.setActiveInstance(Local);

    rollUp = RollupProgram(MERKLE_HEIGHT);

    zkAppWrapper = ZkDatabaseSmartContractWrapper.testConstructor(
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

  it.skip('genesis rollup', async () => {
    const merkleTree = new MerkleTree(MERKLE_HEIGHT);
    let accountStates = Mina.getAccount(zkAppKey.toPublicKey()).zkapp!.appState;
    let currentRoot = accountStates[0];
    let offChainState = currentRoot;
    let previousRoot = accountStates[0];

    merkleTree.setLeaf(0n, Field(1));

    let input = new ZkDatabaseStateInput({
      onChainStatePervious: previousRoot,
      onChainStateCurrent: currentRoot,
      offChainStateCurrent: offChainState,
    });

    await genesisUpdate(
      input,
      Field(0),
      Field(1),
      merkleTree,
      rollUp,
      zkAppWrapper,
      bobKey,
      zkAppKey
    );
  });

  it('genesis rollup + transaction rollup + regular rollup', async () => {
    const merkleTree = new MerkleTree(MERKLE_HEIGHT);
    let accountStates = Mina.getAccount(zkAppKey.toPublicKey()).zkapp!.appState;
    let currentRoot = accountStates[0];
    let previousRoot = accountStates[1];

    Provable.log('currentRoot', currentRoot);
    Provable.log('previousRoot', previousRoot);

    let offChainState = currentRoot;

    const firstLeaf = Field(1);
    merkleTree.setLeaf(0n, firstLeaf);

    let input = new ZkDatabaseStateInput({
      onChainStatePervious: previousRoot,
      onChainStateCurrent: currentRoot,
      offChainStateCurrent: offChainState,
    });

    const firstProof = await genesisUpdate(
      input,
      Field(0),
      Field(1),
      merkleTree,
      rollUp,
      zkAppWrapper,
      bobKey,
      zkAppKey
    );

    accountStates = Mina.getAccount(zkAppKey.toPublicKey()).zkapp!.appState;
    currentRoot = accountStates[0];
    offChainState = merkleTree.getRoot();
    previousRoot = accountStates[1];

    const secondLeaf = Field(2);
    merkleTree.setLeaf(1n, secondLeaf);

    input = new ZkDatabaseStateInput({
      onChainStatePervious: previousRoot,
      onChainStateCurrent: currentRoot,
      offChainStateCurrent: offChainState,
    });

    const secondProof = await transactionUpdate(
      input,
      firstProof,
      firstProof,
      1n,
      Field(0),
      secondLeaf,
      merkleTree,
      rollUp,
      zkAppWrapper,
      bobKey,
      zkAppKey
    );

    accountStates = Mina.getAccount(zkAppKey.toPublicKey()).zkapp!.appState;
    currentRoot = accountStates[0];
    offChainState = merkleTree.getRoot();
    previousRoot = accountStates[1];

    const thirdLeaf = Field(3);
    merkleTree.setLeaf(2n, thirdLeaf);

    input = new ZkDatabaseStateInput({
      onChainStatePervious: previousRoot,
      onChainStateCurrent: currentRoot,
      offChainStateCurrent: offChainState,
    });

    const thirdProof = await transactionUpdate(
      input,
      secondProof,
      secondProof,
      2n,
      Field(0),
      thirdLeaf,
      merkleTree,
      rollUp
    );

    accountStates = Mina.getAccount(zkAppKey.toPublicKey()).zkapp!.appState;
    currentRoot = accountStates[0];
    offChainState = merkleTree.getRoot();
    previousRoot = accountStates[1];

    const fourthLeaf = Field(4);
    merkleTree.setLeaf(3n, fourthLeaf);

    input = new ZkDatabaseStateInput({
      onChainStatePervious: previousRoot,
      onChainStateCurrent: currentRoot,
      offChainStateCurrent: offChainState,
    });

    const fourthProof = await regularUpdate(
      input,
      thirdProof,
      3n,
      Field(0),
      fourthLeaf,
      merkleTree,
      rollUp
    );

    accountStates = Mina.getAccount(zkAppKey.toPublicKey()).zkapp!.appState;
    currentRoot = accountStates[0];
    offChainState = merkleTree.getRoot();
    previousRoot = accountStates[1];

    const fifthLeaf = Field(5);
    merkleTree.setLeaf(4n, fifthLeaf);

    input = new ZkDatabaseStateInput({
      onChainStatePervious: previousRoot,
      onChainStateCurrent: currentRoot,
      offChainStateCurrent: offChainState,
    });

    const fifthProof = await regularUpdate(
      input,
      fourthProof,
      4n,
      Field(0),
      fifthLeaf,
      merkleTree,
      rollUp,
      zkAppWrapper,
      bobKey,
      zkAppKey
    );

    accountStates = Mina.getAccount(zkAppKey.toPublicKey()).zkapp!.appState;
    currentRoot = accountStates[0];
    offChainState = merkleTree.getRoot();
    previousRoot = accountStates[1];

    const sixLeaf = Field(6);
    merkleTree.setLeaf(5n, sixLeaf);

    input = new ZkDatabaseStateInput({
      onChainStatePervious: previousRoot,
      onChainStateCurrent: currentRoot,
      offChainStateCurrent: offChainState,
    });

    const sixProof = await transactionUpdate(
      input,
      fifthProof,
      fifthProof,
      5n,
      Field(0),
      sixLeaf,
      merkleTree,
      rollUp,
      zkAppWrapper,
      bobKey,
      zkAppKey
    );

    accountStates = Mina.getAccount(zkAppKey.toPublicKey()).zkapp!.appState;
    currentRoot = accountStates[0];
    offChainState = merkleTree.getRoot();
    previousRoot = accountStates[1];

    const sevenLeaf = Field(7);
    merkleTree.setLeaf(6n, sevenLeaf);

    input = new ZkDatabaseStateInput({
      onChainStatePervious: previousRoot,
      onChainStateCurrent: currentRoot,
      offChainStateCurrent: offChainState,
    });

    const sevenProof = await transactionUpdate(
      input,
      sixProof,
      sixProof,
      6n,
      Field(0),
      sevenLeaf,
      merkleTree,
      rollUp
    );

    accountStates = Mina.getAccount(zkAppKey.toPublicKey()).zkapp!.appState;
    currentRoot = accountStates[0];
    offChainState = merkleTree.getRoot();
    previousRoot = accountStates[1];

    const eightLeaf = Field(8);
    merkleTree.setLeaf(7n, eightLeaf);

    input = new ZkDatabaseStateInput({
      onChainStatePervious: previousRoot,
      onChainStateCurrent: currentRoot,
      offChainStateCurrent: offChainState,
    });

    await regularUpdate(
      input,
      sevenProof,
      7n,
      Field(0),
      eightLeaf,
      merkleTree,
      rollUp,
      zkAppWrapper,
      bobKey,
      zkAppKey
    );
  });

  it.skip('genesis rollup + transaction rollup + regular rollup', async () => {
    const firstLeaf = Field(1);
    const secondLeaf = Field(2);
    const thirdLeaf = Field(3);

    const merkleTree = new MerkleTree(MERKLE_HEIGHT);
    const zeroRoot = merkleTree.getRoot();

    merkleTree.setLeaf(0n, firstLeaf);

    const firstRoot = merkleTree.getRoot();

    let input = new ZkDatabaseStateInput({
      onChainStatePervious: Field(0),
      onChainStateCurrent: zeroRoot,
      offChainStateCurrent: zeroRoot,
    });

    let proof = await rollUp.init(
      input,
      new DatabaseMerkleWitness(merkleTree.getWitness(0n)),
      Field(0),
      firstLeaf
    );

    const rollUpTx = await zkAppWrapper.createAndProveRollupTransaction(
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

    input = new ZkDatabaseStateInput({
      onChainStatePervious: zeroRoot,
      onChainStateCurrent: firstRoot,
      offChainStateCurrent: firstRoot,
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

    input = new ZkDatabaseStateInput({
      onChainStatePervious: zeroRoot,
      onChainStateCurrent: firstRoot,
      offChainStateCurrent: secondRoot,
    });

    proof = await rollUp.update(
      input,
      proof,
      new DatabaseMerkleWitness(merkleTree.getWitness(2n)),
      Field(0),
      thirdLeaf
    );

    const rollUpTx3 = await zkAppWrapper.createAndProveRollupTransaction(
      {
        sender: bobPk,
        zkApp: zkAppPublic,
      },
      proof.toJSON()
    );

    await rollUpTx3.prove();

    await rollUpTx3.sign([bobKey, zkAppKey]).send();
  });

  it.skip('genesis rollup + transaction rollup + transaction rollup', async () => {
    const firstLeaf = Field(1);
    const secondLeaf = Field(2);
    const thirdLeaf = Field(3);

    const merkleTree = new MerkleTree(MERKLE_HEIGHT);
    const zeroRoot = merkleTree.getRoot();

    merkleTree.setLeaf(0n, firstLeaf);

    const firstRoot = merkleTree.getRoot();

    let input = new ZkDatabaseStateInput({
      onChainStatePervious: Field(0),
      onChainStateCurrent: zeroRoot,
      offChainStateCurrent: zeroRoot,
    });

    let proof = await rollUp.init(
      input,
      new DatabaseMerkleWitness(merkleTree.getWitness(0n)),
      Field(0),
      firstLeaf
    );

    const rollUpTx = await zkAppWrapper.createAndProveRollupTransaction(
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

    input = new ZkDatabaseStateInput({
      onChainStatePervious: zeroRoot,
      onChainStateCurrent: firstRoot,
      offChainStateCurrent: firstRoot,
    });

    proof = await rollUp.updateTransition(
      input,
      proof,
      proof,
      new DatabaseMerkleWitness(merkleTree.getWitness(1n)),
      Field(0),
      secondLeaf
    );

    const rollUpTx2 = await zkAppWrapper.createAndProveRollupTransaction(
      {
        sender: bobPk,
        zkApp: zkAppPublic,
      },
      proof.toJSON()
    );

    await rollUpTx2.prove();

    await rollUpTx2.sign([bobKey, zkAppKey]).send();

    merkleTree.setLeaf(2n, thirdLeaf);

    input = new ZkDatabaseStateInput({
      onChainStatePervious: firstRoot,
      onChainStateCurrent: secondRoot,
      offChainStateCurrent: secondRoot,
    });

    proof = await rollUp.updateTransition(
      input,
      proof,
      proof,
      new DatabaseMerkleWitness(merkleTree.getWitness(2n)),
      Field(0),
      thirdLeaf
    );

    const rollUpTx3 = await zkAppWrapper.createAndProveRollupTransaction(
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

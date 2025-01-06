import { Field, MerkleTree, MerkleWitness, Poseidon } from 'o1js';
import {
  DatabaseRollup,
  RollupProgram,
} from '../../src/proof/proof-program.js';
import { ZkDatabaseStateInput } from '../../src/proof/proof-state.js';

const HEIGHT = 12;

class MyWitness extends MerkleWitness(HEIGHT) {}

describe('RollupProgram', () => {
  let rollUpProgram: DatabaseRollup;

  beforeAll(async () => {
    rollUpProgram = RollupProgram(HEIGHT);
    await rollUpProgram.analyzeMethods();
    await rollUpProgram.compile();
  });

  it('test init proof', async () => {
    const merkleTree = new MerkleTree(HEIGHT);
    const currRoot = merkleTree.getRoot();
    merkleTree.setLeaf(1n, Field(1));

    const proofState = new ZkDatabaseStateInput({
      onChainStatePervious: Field(0),
      onChainStateCurrent: currRoot,
      offChainStateCurrent: currRoot,
    });
    const proof = await rollUpProgram.init(
      proofState,
      new MyWitness(merkleTree.getWitness(1n)),
      Field(0),
      Field(1)
    );

    expect(proof.publicOutput.newOffChainState).toEqual(merkleTree.getRoot());
  });

  it('test basic proof', async () => {
    const merkleTree = new MerkleTree(HEIGHT);
    const currRoot = merkleTree.getRoot();
    merkleTree.setLeaf(1n, Field(1));

    let proofState = new ZkDatabaseStateInput({
      onChainStatePervious: Field(0),
      onChainStateCurrent: currRoot,
      offChainStateCurrent: currRoot,
    });

    const proofInit = await rollUpProgram.init(
      proofState,
      new MyWitness(merkleTree.getWitness(1n)),
      Field(0),
      Field(1)
    );

    proofState = new ZkDatabaseStateInput({
      onChainStatePervious: Field(0),
      onChainStateCurrent: currRoot,
      offChainStateCurrent: merkleTree.getRoot(),
    });

    merkleTree.setLeaf(2n, Field(2));

    const proofBasic = await rollUpProgram.update(
      proofState,
      proofInit,
      new MyWitness(merkleTree.getWitness(2n)),
      Field(0),
      Field(2)
    );

    expect(proofBasic.publicOutput.newOffChainState).toEqual(
      merkleTree.getRoot()
    );
  });

  it('test transition proof', async () => {
    const merkleTree = new MerkleTree(HEIGHT);
    const currRoot = merkleTree.getRoot();
    merkleTree.setLeaf(1n, Field(1));

    let proofState = new ZkDatabaseStateInput({
      onChainStatePervious: Field(0),
      onChainStateCurrent: currRoot,
      offChainStateCurrent: currRoot,
    });

    const proofInit = await rollUpProgram.init(
      proofState,
      new MyWitness(merkleTree.getWitness(1n)),
      Field(0),
      Field(1)
    );

    proofState = new ZkDatabaseStateInput({
      onChainStatePervious: Field(0),
      onChainStateCurrent: currRoot,
      offChainStateCurrent: merkleTree.getRoot(),
    });

    merkleTree.setLeaf(2n, Field(2));

    const proofBasic = await rollUpProgram.update(
      proofState,
      proofInit,
      new MyWitness(merkleTree.getWitness(2n)),
      Field(0),
      Field(2)
    );

    proofState = new ZkDatabaseStateInput({
      onChainStatePervious: currRoot,
      onChainStateCurrent: proofInit.publicOutput.newOffChainState,
      offChainStateCurrent: merkleTree.getRoot(),
    });

    merkleTree.setLeaf(3n, Field(3));

    const proofTransition = await rollUpProgram.updateTransition(
      proofState,
      proofInit,
      proofBasic,
      new MyWitness(merkleTree.getWitness(3n)),
      Field(0),
      Field(3)
    );

    expect(proofTransition.publicOutput.newOffChainState).toEqual(
      merkleTree.getRoot()
    );
  });
});

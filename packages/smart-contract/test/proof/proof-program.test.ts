import { Field, MerkleTree, MerkleWitness, Poseidon } from 'o1js';
import {
  DatabaseRollUp,
  RollUpProgram,
} from '../../src/proof/proof-program.js';
import { ProofStateInput } from '../../src/proof/proof-state.js';

const HEIGHT = 12;

class MyWitness extends MerkleWitness(HEIGHT) {}

describe('RollUpProgram', () => {
  let rollUpProgram: DatabaseRollUp;

  beforeAll(async () => {
    rollUpProgram = RollUpProgram(HEIGHT);
    await rollUpProgram.analyzeMethods();
    await rollUpProgram.compile();
  });

  it('test init proof', async () => {
    const merkleTree = new MerkleTree(HEIGHT);
    const currRoot = merkleTree.getRoot();
    merkleTree.setLeaf(1n, Field(1));

    const proofState = new ProofStateInput({
      previousOnChainState: Field(0),
      currentOnChainState: currRoot,
      currentOffChainState: currRoot,
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

    let proofState = new ProofStateInput({
      previousOnChainState: Field(0),
      currentOnChainState: currRoot,
      currentOffChainState: currRoot,
    });

    const proofInit = await rollUpProgram.init(
      proofState,
      new MyWitness(merkleTree.getWitness(1n)),
      Field(0),
      Field(1)
    );

    proofState = new ProofStateInput({
      previousOnChainState: Field(0),
      currentOnChainState: currRoot,
      currentOffChainState: merkleTree.getRoot(),
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

    let proofState = new ProofStateInput({
      previousOnChainState: Field(0),
      currentOnChainState: currRoot,
      currentOffChainState: currRoot,
    });

    const proofInit = await rollUpProgram.init(
      proofState,
      new MyWitness(merkleTree.getWitness(1n)),
      Field(0),
      Field(1)
    );

    proofState = new ProofStateInput({
      previousOnChainState: Field(0),
      currentOnChainState: currRoot,
      currentOffChainState: merkleTree.getRoot(),
    });

    merkleTree.setLeaf(2n, Field(2));

    const proofBasic = await rollUpProgram.update(
      proofState,
      proofInit,
      new MyWitness(merkleTree.getWitness(2n)),
      Field(0),
      Field(2)
    );

    proofState = new ProofStateInput({
      previousOnChainState: currRoot,
      currentOnChainState: proofInit.publicOutput.newOffChainState,
      currentOffChainState: merkleTree.getRoot(),
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

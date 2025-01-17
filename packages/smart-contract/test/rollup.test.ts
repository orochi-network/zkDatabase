import { Field, MerkleTree } from 'o1js';
import {
  TRollupProof,
  TRollupTransition,
  ZkDbProcessor,
} from '../src/index.js';

const MERKLE_HEIGHT = 16;

describe('RollupProgram', () => {
  let zkProcessor: ZkDbProcessor;
  const proofStorage: TRollupProof[] = [];
  const transitionStorage: TRollupTransition[] = [];
  const merkleTree = new MerkleTree(MERKLE_HEIGHT);

  beforeAll(async () => {
    ZkDbProcessor.setLogger(console);
    zkProcessor = await ZkDbProcessor.getInstance(MERKLE_HEIGHT);
  });

  it('init zk rollup program', async () => {
    // Update index 0 with a leaf
    merkleTree.setLeaf(0n, Field(1337));
    const proof = await zkProcessor.init(
      merkleTree.getRoot(),
      merkleTree.getWitness(0n),
      Field(1337)
    );
    proofStorage.push(proof);
    expect(proof.proof.publicOutput.merkleRoot.toString()).toEqual(
      merkleTree.getRoot().toString()
    );
  });

  it('generate trace of transition', async () => {
    for (let i = 1; i < 4; i += 1) {
      const index = BigInt(i);
      const leafOld = Field(0n);
      const leafNew = Field(Math.round(Math.random() * 0xffff));
      merkleTree.setLeaf(index, leafNew);
      transitionStorage.push({
        leafOld,
        leafNew,
        merkleProof: merkleTree.getWitness(index),
        merkleRootNew: merkleTree.getRoot(),
      });
    }
  });

  it('prove insert of transitions', async () => {
    for (let i = 0; i < 3; i += 1) {
      const previousProof = proofStorage[i];
      const proof = await zkProcessor.update(
        previousProof,
        transitionStorage[i]
      );
      proofStorage.push(proof);
    }
  });

  it('prove update transition', async () => {
    const index = 1n;
    const previousProof = proofStorage[proofStorage.length - 1];
    const leafOld = transitionStorage[Number(index - 1n)].leafNew;
    const leafNew = Field(Math.round(Math.random() * 0xffff));
    merkleTree.setLeaf(index, leafNew);
    const proof = await zkProcessor.update(previousProof, {
      leafOld,
      leafNew,
      merkleProof: merkleTree.getWitness(index),
      merkleRootNew: merkleTree.getRoot(),
    });
    proofStorage.push(proof);
  });

  it('prove delete transition', async () => {
    const index = 2n;
    const previousProof = proofStorage[proofStorage.length - 1];
    const leafOld = transitionStorage[Number(index - 1n)].leafNew;
    const leafNew = Field(0);
    merkleTree.setLeaf(index, leafNew);
    const proof = await zkProcessor.update(previousProof, {
      leafOld,
      leafNew,
      merkleProof: merkleTree.getWitness(index),
      merkleRootNew: merkleTree.getRoot(),
    });
    proofStorage.push(proof);
  });
});

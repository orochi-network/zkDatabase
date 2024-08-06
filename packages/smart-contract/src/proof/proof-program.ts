import { ZkProgram, Field, SelfProof, MerkleWitness } from 'o1js';
import { ProofState } from './proof-state.js';

export type DatabaseRollUp = ReturnType<typeof RollUpProgram>;

export function RollUpProgram(name: string, merkleTreeHeight: number) {
  class DatabaseMerkleWitness extends MerkleWitness(merkleTreeHeight) {}

  return ZkProgram({
    name: name,
    publicInput: ProofState,
    publicOutput: ProofState,

    methods: {
      init: {
        privateInputs: [DatabaseMerkleWitness, Field, Field],

        async method(
          state: ProofState,
          witness: DatabaseMerkleWitness,
          oldLeaf: Field,
          newLeaf: Field
        ) {
          witness.calculateRoot(oldLeaf).assertEquals(state.rootState);
          const newRoot = witness.calculateRoot(newLeaf);
          return new ProofState({
            rootState: newRoot,
          });
        },
      },

      update: {
        privateInputs: [SelfProof, DatabaseMerkleWitness, Field, Field],

        async method(
          state: ProofState,
          proof: SelfProof<ProofState, ProofState>,
          witness: DatabaseMerkleWitness,
          oldLeaf: Field,
          newLeaf: Field
        ) {
          proof.verify();

          proof.publicInput.rootState.assertEquals(state.rootState);

          witness
            .calculateRoot(oldLeaf)
            .assertEquals(proof.publicOutput.rootState);
          const newRoot = witness.calculateRoot(newLeaf);
          return new ProofState({
            rootState: newRoot,
          });
        },
      },
    },
  });
}

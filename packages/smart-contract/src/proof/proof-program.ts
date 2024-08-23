import {
  ZkProgram,
  Field,
  SelfProof,
  MerkleWitness,
  Bool,
  Provable,
} from 'o1js';
import { ProofStateInput, ProofStateOutput } from './proof-state.js';

export type DatabaseRollUp = ReturnType<typeof RollUpProgram>;

export function RollUpProgram(merkleTreeHeight: number) {
  class DatabaseMerkleWitness extends MerkleWitness(merkleTreeHeight) {}

  return ZkProgram({
    name: 'zkdatabase-rollup',
    publicInput: ProofStateInput,
    publicOutput: ProofStateOutput,

    methods: {
      init: {
        privateInputs: [DatabaseMerkleWitness, Field, Field],

        async method(
          state: ProofStateInput,
          witness: DatabaseMerkleWitness,
          oldLeaf: Field,
          newLeaf: Field
        ) {
          witness
            .calculateRoot(oldLeaf)
            .assertEquals(state.currentOffChainState);
          const newOffChainState = witness.calculateRoot(newLeaf);

          return new ProofStateOutput({
            newOffChainState,
            // update off-chain on-chain state
            onChainState: state.currentOnChainState,
            isTransition: Bool(false),
          });
        },
      },

      updateTransition: {
        privateInputs: [
          SelfProof,
          SelfProof,
          DatabaseMerkleWitness,
          Field,
          Field,
        ],

        async method(
          state: ProofStateInput,
          rollupProof: SelfProof<ProofStateInput, ProofStateOutput>,
          prevProof: SelfProof<ProofStateInput, ProofStateOutput>,
          witness: DatabaseMerkleWitness,
          oldLeaf: Field,
          newLeaf: Field
        ) {
          rollupProof.verify();
          prevProof.verify();

          Provable.if(
            prevProof.publicOutput.isTransition,
            Bool,
            Bool(true),
            rollupProof.publicInput.currentOnChainState
              .equals(prevProof.publicInput.currentOnChainState)
              .and(
                rollupProof.publicInput.previousOnChainState.equals(
                  prevProof.publicInput.previousOnChainState
                )
              )
          ).assertTrue();

          // check if current off-chain on-chain state is different from real on-chain state
          state.previousOnChainState.assertEquals(
            prevProof.publicOutput.onChainState
          );

          // check if there was really a proof that which were provided to on-chain to update state
          rollupProof.publicOutput.newOffChainState.assertEquals(
            state.currentOnChainState
          );

          prevProof.publicOutput.newOffChainState.assertEquals(
            state.currentOffChainState
          );

          witness
            .calculateRoot(oldLeaf)
            .assertEquals(state.currentOffChainState);

          const newOffChainState = witness.calculateRoot(newLeaf);

          return new ProofStateOutput({
            newOffChainState,
            // update off-chain on-chain state
            onChainState: state.currentOnChainState,
            isTransition: Bool(true),
          });
        },
      },

      update: {
        privateInputs: [SelfProof, DatabaseMerkleWitness, Field, Field],

        async method(
          state: ProofStateInput,
          prevProof: SelfProof<ProofStateInput, ProofStateOutput>,
          witness: DatabaseMerkleWitness,
          oldLeaf: Field,
          newLeaf: Field
        ) {
          prevProof.verify();

          prevProof.publicInput.previousOnChainState.assertEquals(
            state.previousOnChainState
          );

          state.currentOnChainState.assertEquals(
            prevProof.publicOutput.onChainState
          );

          prevProof.publicOutput.newOffChainState.assertEquals(
            state.currentOffChainState
          );

          witness
            .calculateRoot(oldLeaf)
            .assertEquals(state.currentOffChainState);

          const newOffChainState = witness.calculateRoot(newLeaf);

          return new ProofStateOutput({
            newOffChainState,
            onChainState: state.currentOnChainState,
            isTransition: Bool(false),
          });
        },
      },
    },
  });
}

import {
  ZkProgram,
  Field,
  SelfProof,
  MerkleWitness,
  Bool,
  Provable,
} from 'o1js';
import { ProofStateInput, ProofStateOutput } from './proof-state';

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
            .assertEquals(
              state.currentOffChainState,
              'Inconsistent on-chain state. State value was modified before the initial proof.'
            );
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

          // Handle the case when two roll-up occurred sequentially
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
          ).assertTrue(
            'Passed value is not transition. The proof used to sync (roll-up) off-chain state with on-chain is equaled.'
          );

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
            onChainState: rollupProof.publicOutput.newOffChainState,
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
            state.previousOnChainState,
            'The previous root stored off-chain is different from the root stored on-chain'
          );

          state.currentOnChainState.assertEquals(
            prevProof.publicOutput.onChainState,
            'The root stored off-chain is different from the root stored on-chain'
          );

          prevProof.publicOutput.newOffChainState.assertEquals(
            state.currentOffChainState,
            'The previous off-chain state is different from the current off-chain state. Must be consistent.'
          );

          witness
            .calculateRoot(oldLeaf)
            .assertEquals(
              state.currentOffChainState,
              'The root with old leaf does not equal current off-chain state'
            );

          const newOffChainState = witness.calculateRoot(newLeaf);

          return new ProofStateOutput({
            newOffChainState,
            onChainState: prevProof.publicOutput.onChainState,
            isTransition: Bool(false),
          });
        },
      },
    },
  });
}

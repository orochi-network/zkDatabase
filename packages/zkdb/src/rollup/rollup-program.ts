import {
  AccountUpdate,
  ZkProgram,
  Field,
  SelfProof,
  Cache,
  MerkleWitness
} from 'o1js';
import { RollUpInput, RollUpOutput } from './rollup-params.js';
import { Action } from './action.js';

export type DatabaseRollUp = ReturnType<typeof RollUpProgram>;

function calculateActionState(oldActionState: Field, action: Action) {
  const actionsHash = AccountUpdate.Actions.hash([Action.toFields(action)]);
  const newActionState = AccountUpdate.Actions.updateSequenceState(
    oldActionState,
    actionsHash
  );
  return newActionState;
}

function RollUpProgram(name: string, merkleTreeHeight: number) {
  class DatabaseMerkleWitness extends MerkleWitness(merkleTreeHeight) {}

  return ZkProgram({
    name: name,
    publicInput: RollUpInput,
    publicOutput: RollUpOutput,

    methods: {
      init: {
        privateInputs: [Action, DatabaseMerkleWitness, Field],

        method(
          state: RollUpInput,
          action: Action,
          witness: DatabaseMerkleWitness,
          oldLeaf: Field
        ) {
          witness.calculateRoot(oldLeaf).assertEquals(state.onChainRoot);
          witness.calculateIndex().assertEquals(action.index.toFields()[0]);

          const newActionState = calculateActionState(
            state.onChainActionState,
            action
          );
          const newRoot = witness.calculateRoot(action.hash);
          return new RollUpOutput({
            newActionState: newActionState,
            newRoot: newRoot,
          });
        },
      },
      
      update: {
        privateInputs: [SelfProof, Action, DatabaseMerkleWitness, Field],

        method(
          state: RollUpInput,
          proof: SelfProof<RollUpInput, RollUpOutput>,
          action: Action,
          witness: DatabaseMerkleWitness,
          oldLeaf: Field
        ) {
          proof.verify();

          proof.publicInput.onChainActionState.assertEquals(
            state.onChainActionState
          );
          proof.publicInput.onChainRoot.assertEquals(state.onChainRoot);

          witness
            .calculateRoot(oldLeaf)
            .assertEquals(proof.publicOutput.newRoot);
          witness.calculateIndex().assertEquals(action.index.toFields()[0]);

          const newActionState = calculateActionState(
            proof.publicOutput.newActionState,
            action
          );
          const newRoot = witness.calculateRoot(action.hash);
          return new RollUpOutput({
            newActionState: newActionState,
            newRoot: newRoot,
          });
        },
      },
    },
  });
}

export function getDatabaseRollUpFunction(
  name: string,
  merkleHeight: number
): RollUpProxy {
  const rollup = RollUpProgram(name, merkleHeight);
  return new RollUpProxy(rollup);
}

export class RollUpProxy {
  private rollUp: DatabaseRollUp;
  private isCompiled = false;

  constructor(rollUp: DatabaseRollUp) {
    this.rollUp = rollUp;
  }

  async compile() {
    if (this.isCompiled) {
      return;
    }

    const cache = Cache.FileSystem('./database-rollup');
    await this.rollUp.compile({ cache });
    this.isCompiled = true;
  }

  getProgram(): DatabaseRollUp {
    return this.rollUp;
  }
}

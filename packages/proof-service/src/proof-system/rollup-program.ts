import {
  ZkProgram,
  Field,
  SelfProof,
  MerkleWitness,
} from 'o1js';
import { CircuitCache } from '../cache/circuit-cache.js';

export type DatabaseRollUp = ReturnType<typeof RollUpProgram>;

function RollUpProgram(name: string, merkleTreeHeight: number) {
  class DatabaseMerkleWitness extends MerkleWitness(merkleTreeHeight) {}

  return ZkProgram({
    name: name,
    publicInput: Field,
    publicOutput: Field,

    methods: {
      init: {
        privateInputs: [DatabaseMerkleWitness, Field, Field],

        method(
          state: Field,
          witness: DatabaseMerkleWitness,
          oldLeaf: Field,
          newLeaf: Field
        ) {
          witness.calculateRoot(oldLeaf).assertEquals(state);
          return witness.calculateRoot(newLeaf);
        },
      },

      update: {
        privateInputs: [SelfProof, DatabaseMerkleWitness, Field, Field],

        method(
          state: Field,
          proof: SelfProof<Field, Field>,
          witness: DatabaseMerkleWitness,
          oldLeaf: Field,
          newLeaf: Field
        ) {
          proof.verify();

          proof.publicOutput.assertEquals(state);
          witness.calculateRoot(oldLeaf).assertEquals(state);

          return witness.calculateRoot(newLeaf);
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

    const circuitCache = new CircuitCache();
    const cache = circuitCache.getCache(`database-rollup/${this.rollUp.name}`);
    await this.rollUp.compile({ cache });
    this.isCompiled = true;
  }

  getProgram(): DatabaseRollUp {
    return this.rollUp;
  }
}

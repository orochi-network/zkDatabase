import {
  DynamicProof,
  FeatureFlags,
  Field,
  MerkleWitness,
  SelfProof,
  Struct,
  ZkProgram,
} from 'o1js';

export type ZkDbRollup = ReturnType<typeof ZkDbRollupFactory>;

export class ZkDbRollupInput extends Struct({
  step: Field,
  merkleRootOld: Field,
  merkleRootNew: Field,
}) {}

export class ZkDbRollupOutput extends Struct({
  step: Field,
  merkleRoot: Field,
}) {}

export class ZkDbRollupDynamicProof extends DynamicProof<
  ZkDbRollupInput,
  ZkDbRollupOutput
> {
  static publicInputType = ZkDbRollupInput;
  static publicOutputType = ZkDbRollupOutput;

  static maxProofsVerified = 0 as const;

  static featureFlags = FeatureFlags.allMaybe;
}

export function ZkDbRollupFactory(merkleTreeHeight: number) {
  class ZkDbMerkleWitness extends MerkleWitness(merkleTreeHeight) {}

  return ZkProgram({
    name: 'zk-database-rollup',

    publicInput: ZkDbRollupInput,

    publicOutput: ZkDbRollupOutput,

    methods: {
      init: {
        privateInputs: [ZkDbMerkleWitness, Field],

        async method(
          stateInput: ZkDbRollupInput,
          merkleProof: ZkDbMerkleWitness,
          leaf: Field
        ) {
          stateInput.merkleRootOld.assertEquals(
            Field(0),
            'Initial step require old merkle root to be Field(0)'
          );

          // Make sure merkle proof is valid for root of zero merkle tree
          merkleProof
            .calculateRoot(leaf)
            .assertEquals(stateInput.merkleRootNew);

          stateInput.step.assertEquals(Field(0));

          return {
            publicOutput: new ZkDbRollupOutput({
              step: stateInput.step.add(1),
              merkleRoot: stateInput.merkleRootNew,
            }),
          };
        },
      },

      update: {
        privateInputs: [SelfProof, ZkDbMerkleWitness, Field, Field],

        async method(
          stateInput: ZkDbRollupInput,
          previousProof: SelfProof<ZkDbRollupInput, ZkDbRollupOutput>,
          merkleProof: ZkDbMerkleWitness,
          leafOld: Field,
          leafNew: Field
        ) {
          previousProof.verify();

          previousProof.publicInput.step
            .add(1)
            .assertEquals(
              previousProof.publicOutput.step,
              'Step must increase by one'
            );

          previousProof.publicOutput.step.assertEquals(
            stateInput.step,
            'This proof must be linked to previous proof'
          );

          // It happened since state will create a chain
          // prevProof.publicOutput.merkleRoot === currentProof.publicInput.merkleRootOld
          previousProof.publicOutput.merkleRoot.assertEquals(
            stateInput.merkleRootOld,
            'Output of previous proof must be equal to old merkle root.'
          );

          // Recalculate old root and make sure it's equal to old merkle root.
          merkleProof
            .calculateRoot(leafOld)
            .assertEquals(
              stateInput.merkleRootOld,
              'Root of old leaf must be equal to old merkle root.'
            );

          // Recalculate new root and make sure it's equal to new merkle root.
          merkleProof
            .calculateRoot(leafNew)
            .assertEquals(
              stateInput.merkleRootNew,
              'Root of new leaf must be equal to new merkle root.'
            );

          return {
            publicOutput: new ZkDbRollupOutput({
              step: stateInput.step.add(1),
              merkleRoot: stateInput.merkleRootNew,
            }),
          };
        },
      },
    },
  });
}

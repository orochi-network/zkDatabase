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
  merkleRootOnChain: Field,
  merkleRootOld: Field,
  merkleRootNew: Field,
}) {}

export class ZkDbRollupOutput extends Struct({
  merkleRootOnChain: Field,
  merkleRoot: Field,
}) {}

export class ZkDbRollupProof extends DynamicProof<
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
        privateInputs: [ZkDbMerkleWitness],

        async method(
          stateInput: ZkDbRollupInput,
          merkleProof: ZkDbMerkleWitness
        ) {
          // Make sure merkle proof is valid for root of zero merkle tree
          merkleProof
            .calculateRoot(Field(0))
            .assertEquals(stateInput.merkleRootNew);

          stateInput.merkleRootOnChain.assertEquals(stateInput.merkleRootNew);

          return {
            publicOutput: new ZkDbRollupOutput({
              merkleRootOnChain: stateInput.merkleRootOnChain,
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

          previousProof.publicOutput.merkleRootOnChain.assertEquals(
            stateInput.merkleRootOnChain,
            'Merkle root on chain must be equal for all proofs.'
          );

          // It happened since state will create a chain
          // prevProof.publicOutput.merkleRoot === currentProof.publicInput.merkleRootOld
          previousProof.publicOutput.merkleRoot.assertEquals(
            stateInput.merkleRootOld,
            'Out put of previous proof must be equal to old merkle root.'
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
              merkleRootOnChain: stateInput.merkleRootOnChain,
              merkleRoot: stateInput.merkleRootNew,
            }),
          };
        },
      },
    },
  });
}

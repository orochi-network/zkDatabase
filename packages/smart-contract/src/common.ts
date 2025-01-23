import { Field, JsonProof, Proof } from 'o1js';
import { Witness } from 'o1js/dist/node/lib/provable/merkle-tree.js';
import { ZkDbRollupInput, ZkDbRollupOutput } from './zkdb-rollup.js';

export type TRollupProof = {
  step: Field;
  proof: Proof<ZkDbRollupInput, ZkDbRollupOutput>;
  merkleRootOld: Field;
};

export type TRollupSerializedProof = {
  step: bigint;
  proof: JsonProof;
  merkleRootOld: string;
};

export type TRollupTransition = {
  merkleRootNew: Field;
  merkleProof: Witness;
  leafOld: Field;
  leafNew: Field;
};

export enum EZkDbContractName {
  Contract = 'ZkDbContract',
  Rollup = 'ZkDbRollup',
}

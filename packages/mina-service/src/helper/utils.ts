import { TMerkleProofSerialized } from '@zkdb/common';
import { TRollupTransition } from '@zkdb/smart-contract';
import { TTransitionLogRecord } from '@zkdb/storage';
import { Field } from 'o1js';
import { Witness } from 'o1js/dist/node/lib/provable/merkle-tree';

export function deserializeMerkleProof(
  serializedMerkleProof: TMerkleProofSerialized[]
): Witness {
  return serializedMerkleProof.map(({ sibling, isLeft }) => ({
    isLeft,
    sibling: new Field(sibling),
  }));
}

export function deserializeTransition(
  serializedTransition: TTransitionLogRecord
): TRollupTransition {
  return {
    merkleRootNew: new Field(serializedTransition.merkleRootNew),
    merkleProof: deserializeMerkleProof(serializedTransition.merkleProof),
    leafOld: new Field(serializedTransition.leafOld),
    leafNew: new Field(serializedTransition.leafNew),
  };
}

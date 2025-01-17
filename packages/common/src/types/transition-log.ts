import { TDbRecord } from './common';
import { TMerkleProofSerialized } from './merkle-tree';

export type TTransitionLog = {
  merkleRootOld: string;
  merkleRootNew: string;
  merkleProof: TMerkleProofSerialized[];
  leafOld: string;
  leafNew: string;
  operationNumber: bigint;
};

export type TTransitionLogRecord = TDbRecord<TTransitionLog>;

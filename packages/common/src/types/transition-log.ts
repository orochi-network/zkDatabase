import { TDbRecord } from './common';
import { TMerkleProofSerialized } from './merkle-tree';

export type TTransitionLog = {
  merkleRootNew: string;
  merkleProof: TMerkleProofSerialized[];
  leafOld: string;
  leafNew: string;
  operationNumber: number;
};

export type TTransitionLogRecord = TDbRecord<TTransitionLog>;

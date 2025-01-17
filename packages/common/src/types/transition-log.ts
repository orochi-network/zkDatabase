import { TDbRecord } from './common';
import { TMerkleProofSerialized } from './merkle-tree';
import { EDocumentOperation } from './queue';

export type TTransitionLog = {
  merkleRootNew: string;
  merkleProof: TMerkleProofSerialized[];
  leafOld: string;
  leafNew: string;
  operationNumber: bigint;
  operationKind: EDocumentOperation;
  // Should be null if the operation kind is create
  previousDocumentObjectId: string | null;
  // Should be null if the operation kind is drop
  currentDocumentObjectId: string | null;
};

export type TTransitionLogRecord = TDbRecord<TTransitionLog>;

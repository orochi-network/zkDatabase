import { TDbRecord } from './common';

export enum ESequencer {
  MerkleIndex,
  Operation,
}

export type TSequencedItem = TDbRecord<{
  seq: number;
}>;

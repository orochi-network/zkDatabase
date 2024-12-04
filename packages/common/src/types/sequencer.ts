import { TDbRecord } from './common';

/**
 * Sequencer type
 * @enum
 * @property {string} MerkleIndex - Merkle index
 * @property {string} Operation - Operation
 */
export enum ESequencer {
  MerkleIndex = 'MerkleIndex',
  Operation = 'Operation',
}

export type TSequencedItem = TDbRecord<{
  seq: number;
}>;

import { TDbRecord } from './common';

/**
 * Sequencer type
 * @enum
 * @property {string} MerkleIndex - Merkle index
 * @property {string} Operation - Operation tracking document updates
 * @property {string} LastProcessedOperation - Latest processed operation by the queue
 */
export enum ESequencer {
  // The current Merkle tree index
  MerkleIndex = 'MerkleIndex',
  // The latest operation number performed by the user, i.e. each document
  // update, create, or delete bumps this number by one.
  Operation = 'Operation',
  // The highest operation number that has been fully processed and
  // incorporated into the current Merkle tree state. This number should always
  // be less than or equal to the Operation number.
  LastProcessedOperation = 'LastProcessedOperation',
}

export type TSequencedItem = TDbRecord<{
  type: ESequencer;
  seq: number;
}>;

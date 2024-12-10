import { Field } from 'o1js';
import { TDatabaseRequest } from './database.js';
import { TPagination } from './pagination.js';
import { TDbRecord } from './common.js';

export type TMerkleNode = {
  hash: Field;
  index: number;
  level: number;
  empty: boolean;
};

export type TMerkleProof = {
  sibling: Field;
  isLeft: boolean;
};

export type TMerkleJson<T> = Omit<T, 'hash'> & {
  hash: string;
};

export type TMerkleProofData = TMerkleJson<TMerkleProof>;

export type TMerkleNodeData = TMerkleJson<TMerkleNode>;

export type TMerkleNodeRecord = TDbRecord<TMerkleNodeData>;

export type TMerkleWitnessNode = TMerkleNode & {
  witness: boolean;
  target: boolean;
};

export type TMerkleWitnessNodeData = TMerkleJson<TMerkleWitnessNode>;

export type TMerkleTreeInfo = {
  merkleRoot: string;
  merkleHeight: number;
};

export type TMerkleTreeIndexRequest = TDatabaseRequest & {
  index: string;
};

export type TMerkleTreeWitnessByDocumentRequest = TDatabaseRequest & {
  docId: string;
};

export type TMerkleTreeGetNodeRequest = TMerkleTreeIndexRequest & {
  level: number;
};

export type TMerkleTreeGetNodesByLevelRequest = TDatabaseRequest & {
  level: number;
  pagination: TPagination;
};

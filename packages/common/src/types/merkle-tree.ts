import type { Field } from 'o1js';
import { TDatabaseRequest } from './database.js';
import { TPagination, TPaginationReturn } from './pagination.js';
import { TDbRecord } from './common.js';

export type TMerkle = {
  // Must be index
  hash: string;
  level: number;
  index: bigint;
};

export type TMerkleNode = Pick<
  TMerkleField<TMerkle>,
  'hash' | 'level' | 'index'
>;

export type TMerkleRecord = TDbRecord<TMerkle>;

export type TMerkleProof = {
  sibling: Field;
  isLeft: boolean;
};

export type TMerkleEmptyNode = {
  empty: boolean;
};

export type TMerkleJson<T> = Omit<T, 'hash'> & {
  hash: string;
};

export type TMerkleField<T> = Omit<T, 'hash'> & {
  hash: Field;
};

export type TMerkleWitness = {
  witness: boolean;
  target: boolean;
};

export type TMerkleProofSerialized = Omit<TMerkleProof, 'sibling'> & {
  sibling: string;
};

export type TMerkleNodeDetailJson = TMerkleJson<TMerkleNode> &
  TMerkleEmptyNode &
  TMerkleWitness;

export type TMerkleNodeJson = TMerkleJson<TMerkleNode> & TMerkleEmptyNode;

export type TMerkleTreeInfo = {
  merkleRoot: string;
  merkleHeight: number;
};

export type TMerkleTreeProofByIndexRequest = TDatabaseRequest & {
  index: string;
};

export type TMerkleTreeProofByIndexResponse = Array<TMerkleProofSerialized>;

export type TMerkleTreeProofByDocIdRequest = TDatabaseRequest & {
  docId: string;
};

export type TMerkleTreeProofByDocIdResponse = TMerkleTreeProofByIndexResponse;

export type TMerkleTreeNodeListByLevelRequest = TDatabaseRequest & {
  level: number;
  pagination?: TPagination;
};

export type TMerkleTreeNodeListByLevelResponse = TPaginationReturn<
  TMerkleNodeJson[]
>;

export type TMerkleTreeInfoRequest = TDatabaseRequest;

export type TMerkleTreeInfoResponse = TMerkleTreeInfo;

export type TMerkleTreeNodeChildrenRequest = TDatabaseRequest &
  Pick<TMerkle, 'index' | 'level'>;

export type TMerkleTreeNodeChildrenResponse = TMerkleNodeJson[];

export type TMerkleTreeNodePathRequest = TMerkleTreeProofByDocIdRequest;

export type TMerkleTreeNodePathResponse = TMerkleNodeDetailJson[];

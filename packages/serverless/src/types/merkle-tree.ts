import { TDatabaseRequest } from './database.js';
import { TPagination } from './pagination.js';

export type TMerkleNode = {
  hash: string;
  index: number;
  level: number;
  empty: boolean;
};

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

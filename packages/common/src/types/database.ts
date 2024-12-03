import { TCollectionDetail } from './collection.js';
import { TPagination } from './pagination.js';
import { ETransactionStatus } from './transaction.js';

export type TDatabase = {
  databaseName: string;
  databaseOwner: string;
  merkleHeight: number;
  collection: TCollectionDetail[];
  databaseSize: number;
  appPublicKey: string;
  deployStatus: ETransactionStatus;
};

export type TDatabaseRequest = {
  databaseName: string;
};

export type TDatabaseUpdateDeployedRequest = TDatabaseRequest & {
  appPublicKey: string;
};
export type TDatabaseSearchRequest = {
  query: { [key: string]: string };
  pagination: TPagination;
};

export type TDatabaseCreateRequest = TDatabaseRequest & {
  merkleHeight: number;
};

export type TDatabaseFindByIndexRequest = TDatabaseRequest & {
  index: number;
};

export type TDatabaseChangeOwnerRequest = TDatabaseRequest & {
  newOwner: string;
};

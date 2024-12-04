import { TCollectionAndMetadata } from './collection.js';
import { TDbRecord } from './common.js';
import { TPagination } from './pagination.js';
import { ETransactionStatus } from './transaction.js';

export type TDatabase = {
  databaseName: string;
  databaseOwner: string;
  merkleHeight: number;
  collection: TCollectionAndMetadata[];
  databaseSize: number;
  appPublicKey: string;
  deployStatus: ETransactionStatus;
};

export type TDatabaseRecord = TDbRecord<TDatabase>;

export type TDatabaseRequest = Pick<TDatabase, 'databaseName'>;

export type TDatabaseUpdateDeployedRequest = TDatabaseRequest &
  Pick<TDatabase, 'appPublicKey'>;

export type TDatabaseSearchRequest = {
  query: { [K in keyof TDatabaseRecord]: TDatabaseRecord[K] };
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

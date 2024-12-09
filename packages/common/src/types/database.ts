import { TDbRecord } from './common.js';
import { TMetadataCollection } from './metadata.js';
import { TPagination, TPaginationReturn } from './pagination.js';
import { ETransactionStatus } from './transaction.js';

export type TDatabase = {
  databaseName: string;
  databaseOwner: string;
  merkleHeight: number;
  appPublicKey: string;
};

export type TDatabaseDetail = TDatabase & {
  collection: TMetadataCollection[];
  databaseSize: number;
  deployStatus: ETransactionStatus;
};

export type TDatabaseRecord = TDbRecord<TDatabase>;

export type TDatabaseRequest = Pick<TDatabase, 'databaseName'>;

export type TDatabaseResponse = TDatabase;

export type TDatabaseUpdateDeployedRequest = TDatabaseRequest &
  Pick<TDatabase, 'appPublicKey'>;

export type TDatabaseListRequest = {
  query: Partial<TDatabaseRecord>;
  pagination: TPagination;
};

export type TDatabaseListResponse = TPaginationReturn<TDatabaseDetail[]>;
export type TDatabaseCreateRequest = TDatabaseRequest & {
  merkleHeight: number;
};

export type TDatabaseFindByIndexRequest = TDatabaseRequest & {
  index: number;
};

export type TDatabaseChangeOwnerRequest = TDatabaseRequest & {
  newOwner: string;
};

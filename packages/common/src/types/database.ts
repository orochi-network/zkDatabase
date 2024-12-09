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

export type TDatabaseMetadataRecord = TDbRecord<TDatabase>;

// Database
export type TDatabaseRequest = Pick<TDatabase, 'databaseName'>;

export type TDatabaseResponse = TDatabase;

// Database update deploy
export type TDatabaseUpdateDeployedRequest = TDatabaseRequest &
  Pick<TDatabase, 'appPublicKey'>;

// Database list
export type TDatabaseListRequest = {
  query: Partial<TDatabaseMetadataRecord>;
  pagination: TPagination;
};

export type TDatabaseListResponse = TPaginationReturn<TDatabaseDetail[]>;

// Database create
export type TDatabaseCreateRequest = TDatabaseRequest & {
  merkleHeight: number;
};

// Database find index
export type TDatabaseFindByIndexRequest = TDatabaseRequest & {
  index: number;
};

// Database change owner
export type TDatabaseChangeOwnerRequest = TDatabaseRequest & {
  newOwner: string;
};

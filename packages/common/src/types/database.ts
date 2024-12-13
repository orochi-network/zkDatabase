import { TDbRecord } from './common.js';
import { TMetadataCollection } from './metadata.js';
import { TPagination, TPaginationReturn } from './pagination.js';
import { ETransactionStatus } from './transaction.js';

//@NOTE: This is for the whole metadata of the database
export type TMetadataDatabase = {
  databaseName: string;
  databaseOwner: string;
  merkleHeight: number;
  appPublicKey: string;
};

export type TDatabaseKeyRecord = TDbRecord<{
  privateKey: string;
  databaseName: string;
}>;

export type TDatabaseDetail = TMetadataDatabase & {
  collection: TMetadataCollection[];
  databaseSize: number;
  deployStatus: ETransactionStatus;
};

export type TMetadataDatabaseRecord = TDbRecord<TMetadataDatabase>;

// Database
export type TDatabaseRequest = Pick<TMetadataDatabase, 'databaseName'>;

export type TDatabaseResponse = TMetadataDatabase;

// Database update deploy
export type TDatabaseUpdateDeployedRequest = TDatabaseRequest &
  Pick<TMetadataDatabase, 'appPublicKey'>;

// Database list
export type TDatabaseListRequest = {
  query: Partial<TMetadataDatabaseRecord>;
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

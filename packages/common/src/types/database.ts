import { TDbRecord, TPickOptional } from './common.js';
import { TPagination, TPaginationReturn } from './pagination.js';
import { ETransactionStatus } from './transaction.js';

//@NOTE: This is for the whole metadata of the database
export type TMetadataDatabase = {
  databaseName: string;
  databaseOwner: string;
  merkleHeight: number;
  appPublicKey: string;
  // @TODO: This field will be update by our task scheduler to polling status from blockchain
  deployStatus: ETransactionStatus;
};

export type TMetadataDatabaseMongo = {
  sizeOnDisk: number;
};

export type TMetadataDatabaseDetail = TMetadataDatabase &
  TPickOptional<TMetadataDatabaseMongo, 'sizeOnDisk'>;

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

export type TDatabaseListResponse = TPaginationReturn<
  TMetadataDatabaseDetail[]
>;

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

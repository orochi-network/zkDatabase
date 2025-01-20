import { TDbRecord, TPickOptional } from './common.js';
import { TEnvironment } from './environment.js';
import { TPagination, TPaginationReturn } from './pagination.js';
import { ETransactionStatus } from './transaction.js';

export enum ENetworkId {
  Testnet = 'Testnet',
  Mainnet = 'Mainnet',
}

// For model layer
// @NOTE: This is for the whole metadata of the database
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
// For param

export type TDatabaseParamCreate = Pick<
  TMetadataDatabase,
  'databaseName' | 'merkleHeight' | 'databaseOwner'
>;

export type TDatabaseParamIsOwner = Pick<
  TMetadataDatabase,
  'databaseName' | 'databaseOwner'
>;

export type TDatabaseParamListDetail = {
  filter: Partial<TMetadataDatabase>;
  pagination?: TPagination;
};

export type TDatabaseParamTransferOwner = Pick<
  TMetadataDatabase,
  'databaseName' | 'databaseOwner'
> & {
  newOwner: string;
};

export type TDatabaseParamDeploy = Pick<
  TMetadataDatabase,
  'databaseName' | 'appPublicKey'
>;

// For application layer
export type TDatabaseRequest = Pick<TMetadataDatabase, 'databaseName'>;

export type TDatabaseResponse = TMetadataDatabase;

// Database update deploy
export type TDatabaseDeployRequest = TDatabaseRequest &
  Pick<TMetadataDatabase, 'appPublicKey'>;

export type TDatabaseDeployResponse = boolean;

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

export type TDatabaseCreateResponse = boolean;

// Database find index
export type TDatabaseFindByIndexRequest = TDatabaseRequest & {
  index: number;
};

// Database exist
export type TDatabaseEnvironmentRequest = void;

export type TDatabaseEnvironmentResponse = TEnvironment;

// Database exist
export type TDatabaseExistRequest = TDatabaseRequest;

export type TDatabaseExistResponse = boolean;

// Database info
export type TDatabaseInfoRequest = TDatabaseRequest;

export type TDatabaseInfoResponse = TMetadataDatabaseDetail;

// Database stats
export type TDatabaseStatsRequest = TDatabaseRequest;

export type TDatabaseStatsResponse = unknown;

// Need to separate type for onchain and offchain since it too much

import { ObjectId } from 'mongodb';
import { JsonProof } from 'o1js';
import { TDbRecord } from './common';
import { TMetadataDatabase } from './database';
import { TPagination, TPaginationReturn } from './pagination';

// Base type

// NOTE: This type base from @orochi-network/smart-contract -> ZkDbProcessor
export type TRollupSerializedProof = {
  step: bigint;
  proof: JsonProof;
  merkleRootOld: string;
};

export type TRollupBaseHistory = {
  databaseName: string;
  step: bigint;
  merkleTreeRoot: string;
  merkleTreeRootPrevious: string;
};

/**
 * Represents the structure of the data used in the off-chain Rollup Queue system.
 * This type encapsulates the metadata and identifiers needed to process
 * a rollup operation in the system.
 * Used in GenericQueue as a `data` payload
 */
export type TRollupQueueData = {
  databaseName: string;
  operationNumber: number;
  collectionName: string;
  transitionLogObjectId: ObjectId;
  docId: string;
};

// Model

export type TRollUpOffChainRecord = TDbRecord<
  TRollupSerializedProof &
    Pick<TMetadataDatabase, 'databaseName'> & {
      transitionLogObjectId: ObjectId;
    }
>;
// Request & Response

// ==== OffChain History ====
export type TRollupOffChainHistoryRequest = {
  query: Partial<
    Pick<
      TRollupBaseHistory,
      'databaseName' | 'merkleTreeRoot' | 'merkleTreeRootPrevious'
    >
  >;
  pagination: TPagination;
};

export type TRollupOffChainHistoryResponse = TPaginationReturn<
  TRollupBaseHistory[]
> | null;

// Param

export type TRollupOffChainHistoryParam = TRollupOffChainHistoryRequest;

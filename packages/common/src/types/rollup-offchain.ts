// Need to separate type for onchain and offchain since it too much

import { ObjectId } from 'mongodb';
import { JsonProof } from 'o1js';
import { TDbRecord } from './common';
import { TDatabaseRequest, TMetadataDatabase } from './database';
import { TPagination, TPaginationReturn } from './pagination';
import { EQueueTaskStatus, TGenericQueueBase } from './queue';

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
  merkleRootOld: string;
  merkleRootNew: string;
};

/**
 * Represents the structure of the data used in the off-chain Rollup Queue system.
 * This type encapsulates the metadata and identifiers needed to process
 * a rollup operation in the system.
 * Used in GenericQueue as a `data` payload
 */
export type TRollupQueueData = {
  databaseName: string;
  operationNumber: bigint;
  collectionName: string;
  transitionLogObjectId: ObjectId;
  docId: string;
};

export type TRollupOffChainHistory = TRollupBaseHistory &
  Pick<TRollupQueueData, 'docId' | 'collectionName'> &
  Pick<TGenericQueueBase<TRollupQueueData>, 'status' | 'acquiredAt'>;

// Model

export type TRollupOffChainRecord = TDbRecord<
  Pick<TRollupSerializedProof, 'step' | 'proof'> &
    Pick<TMetadataDatabase, 'databaseName'> & {
      transitionLogObjectId: ObjectId;
    }
>;

export type TRollupOffChainState = Pick<TRollupBaseHistory, 'databaseName'> & {
  merkleRootOld: string | null;
  merkleRootNew: string | null;
  rollupOffChainState: EQueueTaskStatus;
  latestRollupOffChainSuccess: Date | null;
};

// Request & Response

// ==== Offchain State ====

export type TRollupOffChainStateRequest = TDatabaseRequest;

export type TRollupOffChainStateResponse = TRollupOffChainState | null;

// ==== OffChain History ====

export type TRollupOffChainHistoryRequest = {
  databaseName: string;
  // Database name is required since we need to use transitionLog model
  pagination?: TPagination;
};

export type TRollupOffChainHistoryResponse = TPaginationReturn<
  TRollupOffChainHistory[]
>;

// Param

export type TRollupOffChainHistoryParam = TRollupOffChainHistoryRequest;

// Common type

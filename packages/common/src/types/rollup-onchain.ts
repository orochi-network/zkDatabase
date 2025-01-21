import type { ObjectId } from 'mongodb';
import { TDbRecord, TNullable } from './common';
import { TDatabaseRequest } from './database';
import { TPagination, TPaginationReturn } from './pagination';
import { TRollupBaseHistory } from './rollup-offchain';
import { TTransactionRecord, TTransactionRecordNullable } from './transaction';

/**
 * Rollup state
 * @enum
 * @property {string} Updated - Rollup is up to date
 * @property {string} Updating - Rollup is updating
 * @property {string} Outdated - Rollup is outdated
 * @property {string} Failed - Rollup is errored
 */

export enum ERollupState {
  Updated = 'Updated',
  Updating = 'Updating',
  Outdated = 'Outdated',
  Failed = 'Failed',
  Unavailable = 'Unavailable',
}

/**
 * Base type for ModelRollupOnChainHistory
 */
export type TRollupOnChainHistory = TRollupBaseHistory & {
  // Previous name `txId` is changed to `transactionObjectId`,
  // txId is not a good name it's alias of tx hash
  // From transactionObjectId we can track the transaction status
  transactionObjectId: ObjectId;
  // Previous name is `proofObjectId` is changed to `rollupOffChainObjectId`
  // Since proof model changed, this will ref to the proof in 'rollup_offchain'
  rollupOffChainObjectId: ObjectId;
};

/*
 * Base type for represents onchain rollup state of that database
 */
export type TRollupOnChainState = Pick<
  TRollupOnChainHistory,
  'databaseName' | 'merkleRootNew' | 'merkleRootOld'
> & {
  // Number of merkle root transformation different to previous one
  rollupDifferent: bigint;
  rollupOnChainState: ERollupState;
  latestRollupOnChainSuccess: Date;
};

/**
 * Nullable type from {@link TRollupOnChainState}
 */
export type TRollupStateNullable = TNullable<
  TRollupOnChainState,
  'latestRollupOnChainSuccess' | 'merkleRootNew' | 'merkleRootOld'
>;

/**
 * Nullable type from {@link TRollupOnChainHistory}
 */
export type TRollupOnChainHistoryNullable = TNullable<
  TRollupOnChainHistory,
  'merkleRootOld'
>;

// Model

/**
 * Model type for {@link ModelRollupOnChainHistory}
 */
export type TRollupOnChainHistoryRecord =
  TDbRecord<TRollupOnChainHistoryNullable>;

// Rollup Request & Response type

// ==== Onchain Create ====
export type TRollupOnChainCreateRequest = TDatabaseRequest;

export type TRollupOnChainCreateResponse = boolean;

// ==== Onchain History ====
export type TRollupOnChainHistoryRequest = {
  databaseName: string;
  pagination?: TPagination;
};

// Hide all ref objectId field related, show status to user
export type TRollupOnChainHistoryDataResponse = TRollupBaseHistory &
  Pick<TTransactionRecordNullable, 'status' | 'error' | 'txHash'>;

export type TRollupOnChainHistoryResponse = TPaginationReturn<
  TRollupOnChainHistoryDataResponse[]
>;

// ==== Onchain State ====
export type TRollupOnChainStateRequest = TDatabaseRequest;

export type TRollupOnChainStateResponse = TRollupStateNullable | null;

// Param type

export type TRollupOnChainHistoryParam = TRollupOnChainHistoryRequest;

// Common type

export type TRollupOnChainHistoryTransactionAggregate = Omit<
  TRollupOnChainHistoryRecord,
  'transactionObjectId'
> & {
  transaction: TTransactionRecord;
};

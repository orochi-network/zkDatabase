import type { ObjectId } from 'mongodb';
import { TDbRecord, TNullable } from './common';
import { TDatabaseRequest } from './database';
import { TPagination, TPaginationReturn } from './pagination';

export enum EMinaTransactionStatus {
  Failed = 'failed',
  Pending = 'pending',
  Applied = 'applied',
}

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
}

export type TRollupHistory = {
  databaseName: string;
  step: bigint;
  merkleTreeRoot: string;
  merkleTreeRootPrevious: string;
  // Previous name `txId` is changed to `transactionObjectId`,
  // txId is not a good name it's alias of tx hash
  // From transactionObjectId we can track the transaction status
  transactionObjectId: ObjectId;
  proofObjectId: ObjectId;
  error: string;
};

export type TRollupState = Pick<
  TRollupHistory,
  'databaseName' | 'merkleTreeRoot' | 'merkleTreeRootPrevious'
> & {
  // Number of merkle root transformation different to previous one
  rollUpDifferent: bigint;
  rollUpState: ERollupState;
  latestRollupSuccess: Date;
  error: string;
};

export type TRollupStateNullable = TNullable<
  TRollupState,
  'error' | 'latestRollupSuccess'
>;

export type TRollupOnChain = {
  databaseName: string;
  step: bigint;
  txHash: string;
  status: EMinaTransactionStatus; // TODO: Redefined
  error: string;
  // TODO:
};

export type TRollOpChainRecordNullable = TDbRecord<
  TNullable<TRollupOnChain, 'error'>
>;

export type TRollupHistoryRecordNullable = TDbRecord<
  TNullable<TRollupHistory, 'error'>
>;

export type TRollupHistoryRecord = TDbRecord<TRollupHistory>;

// Rollup history
export type TRollupHistoryRequest = {
  query: Partial<
    Pick<
      TRollupHistory,
      'databaseName' | 'merkleTreeRoot' | 'merkleTreeRootPrevious'
    >
  >;
  pagination: TPagination;
};

export type TRollupHistoryParam = TRollupHistoryRequest;

export type TRollupHistoryResponse = TPaginationReturn<
  TRollupHistoryRecordNullable[]
> | null;

// Rollup state
export type TRollupStateRequest = TDatabaseRequest;

// RollupStateResponse can be null due to user never make an onchain rollup before
export type TRollupStateResponse = TRollupStateNullable | null;

// Rollup create
export type TRollupCreateRequest = TDatabaseRequest;

export type TRollupCreateResponse = boolean;

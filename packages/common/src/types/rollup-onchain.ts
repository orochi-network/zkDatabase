import type { ObjectId } from 'mongodb';
import { ModelRollupOnChainHistory } from './../../../../node_modules/@zkdb/storage/src/database/global/rollup-history';
import { TDbRecord, TNullable, TPickAlter } from './common';
import { TDatabaseRequest } from './database';
import { TPagination, TPaginationReturn } from './pagination';
import { TRollupBaseHistory } from './rollup-offchain';

// Base type
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

/**
 * Base type for ModelRollupOnChainHistory
 */
export type TRollupOnChainHistory = Omit<
  TRollupBaseHistory,
  'merkleRootNew' | 'merkleRootOld'
> &
  TPickAlter<
    TRollupBaseHistory,
    {
      merkleRootNew: 'merkleRootOnChainNew';
      merkleRootOld: 'merkleRootOnChainOld';
    }
  > & {
    // Previous name `txId` is changed to `transactionObjectId`,
    // txId is not a good name it's alias of tx hash
    // From transactionObjectId we can track the transaction status
    transactionObjectId: ObjectId;
    // Previous name is `proofObjectId` is changed to `rollupOffChainObjectId`
    // Since proof model changed, this will ref to the proof in 'rollup_offchain'
    rollupOffChainObjectId: ObjectId;
    status: EMinaTransactionStatus;
    error: string;
  };

/*
 * Base type for represents onchain rollup state of that database
 */
export type TRollupOnChainState = Pick<
  TRollupOnChainHistory,
  'databaseName' | 'error' | 'merkleRootOnChainNew' | 'merkleRootOnChainOld'
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
  | 'error'
  | 'latestRollupOnChainSuccess'
  | 'merkleRootOnChainNew'
  | 'merkleRootOnChainOld'
>;

/**
 * Nullable type from {@link TRollupOnChainHistory}
 */
export type TRollupOnChainHistoryNullable = TNullable<
  TRollupOnChainHistory,
  'error'
>;

// Model

/**
 * Model type for {@link ModelRollupOnChainHistory}
 */
export type TRollupOnChainHistoryRecord = TDbRecord<TRollupOnChainHistory>;

// Rollup Request & Response type

// ==== Onchain Create ====
export type TRollupOnChainCreateRequest = TDatabaseRequest;

export type TRollupOnChainCreateResponse = boolean;

// ==== Onchain History ====
export type TRollupOnChainHistoryRequest = {
  query: Partial<
    Pick<
      TRollupOnChainHistory,
      'databaseName' | 'merkleRootOnChainNew' | 'merkleRootOnChainOld'
    >
  >;
  pagination: TPagination;
};

export type TRollupHistoryOnChainResponse = TPaginationReturn<
  TRollupOnChainHistoryRecord[]
> | null;

// ==== Onchain State ====
export type TRollupOnChainStateRequest = TDatabaseRequest;

export type TRollupOnChainStateResponse = TRollupStateNullable | null;

// Param type

export type TRollupOnChainHistoryParam = TRollupOnChainHistoryRequest;

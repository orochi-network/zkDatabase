import type { ObjectId } from 'mongodb';
import { TDbRecord, TNullable } from './common';
import { TDatabaseRequest } from './database';
import { TTransactionRecord } from './transaction';

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
  'databaseName' | 'merkleTreeRoot' | 'merkleTreeRootPrevious' | 'error'
> & {
  // Number of merkle root transformation different to previous one
  rollUpDifferent: number;
  rollUpState: ERollupState;
  latestRollupSuccess: Date;
};

export type TRollupHistoryRecordNullable = TDbRecord<
  TNullable<TRollupHistory, 'error'>
>;

export type TRollupHistoryRecord = TDbRecord<TRollupHistory>;

export type TRollupStateRecordNullable = TDbRecord<
  TNullable<TRollupState, 'error' | 'latestRollupSuccess'>
>;

// Compound Type

export type TRollupHistoryTransactionAggregate = TRollupHistoryRecord & {
  transaction: TTransactionRecord;
};

export type TRollupDetail = TRollupStateRecordNullable & {
  history: TRollupHistoryRecordNullable[];
};

// Rollup history
export type TRollupHistoryRequest = TDatabaseRequest;

export type TRollupHistoryResponse = TRollupDetail | null;

// Rollup create
export type TRollupCreateRequest = TDatabaseRequest;

export type TRollupCreateResponse = boolean;

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
  error: string | null;
};

export type TRollupHistoryRecordNullable = TDbRecord<
  TNullable<TRollupHistory, 'error'>
>;

export type TRollupHistoryRecord = TDbRecord<TRollupHistory>;

// Compound Type

export type TRollupHistoryTransactionAggregate = TRollupHistoryRecord & {
  transaction: TTransactionRecord;
};

export type TRollupHistoryDetail = TRollupState & {
  history: TRollupHistoryRecordNullable[];
};

// Rollup history
export type TRollupHistoryRequest = TDatabaseRequest;

export type TRollupHistoryResponse = TRollupHistoryDetail | null;

// Rollup create
export type TRollupCreateRequest = TDatabaseRequest;

export type TRollupCreateResponse = boolean;

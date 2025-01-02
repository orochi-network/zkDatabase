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
export enum ERollUpState {
  Updated = 'Updated',
  Updating = 'Updating',
  Outdated = 'Outdated',
  Failed = 'Failed',
}

export type TRollUpHistory = {
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

export type TRollUpState = Pick<
  TRollUpHistory,
  'databaseName' | 'merkleTreeRoot' | 'merkleTreeRootPrevious' | 'error'
> & {
  // Number of merkle root transformation different to previous one
  rollUpDifferent: number;
  rollUpState: ERollUpState;
  latestRollUpSuccess: Date;
};

export type TRollUpHistoryRecordNullable = TDbRecord<
  TNullable<TRollUpHistory, 'error'>
>;

export type TRollUpHistoryRecord = TDbRecord<TRollUpHistory>;

export type TRollUpStateRecordNullable = TDbRecord<
  TNullable<TRollUpState, 'error' | 'latestRollUpSuccess'>
>;

// Compound Type

export type TRollUpHistoryTransactionAggregate = TRollUpHistoryRecord & {
  transaction: TTransactionRecord;
};

export type TRollUpDetail = TRollUpStateRecordNullable & {
  history: TRollUpHistoryRecordNullable[];
};

// RollUp history
export type TRollupHistoryRequest = TDatabaseRequest;

export type TRollUpHistoryResponse = TRollUpDetail | null;

// Rollup create
export type TRollUpCreateRequest = TDatabaseRequest;

export type TRollUpCreateResponse = boolean;

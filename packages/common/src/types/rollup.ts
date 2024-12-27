import type { ObjectId, WithoutId } from 'mongodb';
import { TDbRecord, TNullable } from './common';
import { TTransaction, TTransactionRecord } from './transaction';
import { TDatabaseRequest } from './database';
import { TProofRecord } from './proof';

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
  rollUpState: ERollUpState;
  rollUpDifferent: number;
  error: string;
};

export type TRollUpHistoryRecordNullable = TDbRecord<
  TNullable<TRollUpHistory, 'error' | 'rollUpDifferent' | 'rollUpState'>
>;

export type TRollUpHistoryRecord = TDbRecord<TRollUpHistory>;

// Compound Type
export type TRollUpTransactionHistory = TRollUpHistory &
  WithoutId<TDbRecord<TTransaction>>;

export type TRollUpHistoryDetail = Pick<
  TRollUpHistoryRecord,
  'databaseName' | 'merkleTreeRoot' | 'merkleTreeRootPrevious'
> & {
  transaction: TTransactionRecord;
  proof: TProofRecord;
};

export type TRollUpDetail = {
  history: TRollUpHistoryDetail[];
  state: ERollUpState;
  // Number of merkle root transformation different to previous one
  rollUpDifferent: number;
};

// RollUp history
export type TRollupHistoryRequest = TDatabaseRequest;

export type TRollUpHistoryResponse = TRollUpDetail;

// Rollup create
export type TRollUpCreateRequest = TDatabaseRequest;

export type TRollUpCreateResponse = boolean;

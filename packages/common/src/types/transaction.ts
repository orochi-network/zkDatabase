import { TDbRecord } from './common.js';
import { TDatabaseRequest } from './database.js';

/**
 * Transaction status
 * @param {Unsigned} Unsigned - Transaction is prepared but not yet signed
 * @param {Signed} Signed - Transaction is signed but not yet broadcasted
 * @param {Unconfirmed} Unconfirmed - Transaction is broadcasted but not yet confirmed
 * @param {Confirming} Confirming - Transaction is confirming in one or more blocks
 * @param {Failed} Failed - Transaction is errored
 * @param {Confirmed} Confirmed - Transaction is confirmed
 * @param {Unknown} Unknown - Transaction is unknown
 * @typedef ETransactionStatus
 */
export enum ETransactionStatus {
  // Transaction is prepared but not yet signed
  Unsigned,
  // Transaction is signed but not yet broadcasted
  Signed,
  // Transaction is broadcasted but not yet confirmed
  Unconfirmed,
  // Transaction is confirming in one or more blocks
  Confirming,
  // Transaction is errored
  Failed,
  // Transaction is confirmed
  Confirmed,
  // Transaction is unknown
  Unknown,
}

export type TTransaction = {
  transactionType: ETransactionType;
  databaseName: string;
  status: ETransactionStatus;
  txHash: string;
  error: string;
};

export type TTransactionRecord = TDbRecord<TTransaction>;

export enum ETransactionType {
  Deploy,
  Rollup,
}

export type TTransactionRequest = TDatabaseRequest & {
  transactionType: ETransactionType;
};

export type TTransactionByIdRequest = TDatabaseRequest & {
  id: string;
};

export type TTransactionConfirmRequest = TTransactionByIdRequest & {
  txHash: string;
};

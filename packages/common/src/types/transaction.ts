import { TDbRecord } from './common.js';
import { TDatabaseRequest } from './database.js';

/**
 * Transaction status
 * @property {Unsigned} Unsigned - Transaction is prepared but not yet signed
 * @property {Signed} Signed - Transaction is signed but not yet broadcasted
 * @property {Unconfirmed} Unconfirmed - Transaction is broadcasted but not yet confirmed
 * @property {Confirming} Confirming - Transaction is confirming in one or more blocks
 * @property {Failed} Failed - Transaction is errored
 * @property {Confirmed} Confirmed - Transaction is confirmed
 * @property {Unknown} Unknown - Transaction is unknown
 * @enum
 */
export enum ETransactionStatus {
  Unsigned = 'Unsigned',
  Signed = 'Signed',
  Unconfirmed = 'Unconfirmed',
  Confirming = 'Confirming',
  Failed = 'Failed',
  Confirmed = 'Confirmed',
  Unknown = 'Unknown',
}

/**
 * Transaction type
 * @property {string} Deploy - Deploy transaction
 * @property {string} Rollup - Rollup transaction
 * @enum
 */
export enum ETransactionType {
  Deploy = 'Deploy',
  Rollup = 'Rollup',
}

/**
 * Transaction
 * @param {transactionType} transactionType - Transaction type
 * @param {databaseName} databaseName - Database name
 * @param {status} status - Transaction status
 * @param {txHash} txHash - Transaction hash
 * @param {error} error - Error message
 * @typedef TTransaction
 */
export type TTransaction = {
  transactionType: ETransactionType;
  databaseName: string;
  status: ETransactionStatus;
  transactionBody: string,
  txHash: string;
  error: string;
};

/**
 * Transaction record to store in database
 * @typedef TTransactionRecord
 * @param {string} TTransaction._id - Transaction ID
 * @param {ETransactionType} TTransaction.transactionType - Transaction type
 * @param {string} TTransaction.databaseName - Database name
 * @param {ETransactionStatus} TTransaction.status - Transaction status
 * @param {string} TTransaction.txHash - Transaction hash
 * @param {string} TTransaction.error - Error message
 * @param {Date} createdAt - Created at
 * @param {Date} updatedAt - Updated at
  */
export type TTransactionRecord = TDbRecord<TTransaction>;

/**
 * Transaction request
 * @typedef TTransactionRequest
 * @param {string} TDatabaseRequest.databaseName - Database name
 * @param {ETransactionType} transactionType - Transaction type
  */
export type TTransactionRequest = TDatabaseRequest & {
  transactionType: ETransactionType;
};

/**
 * Transaction by ID request
 * @typedef TTransactionByIdRequest
 * @param {string} TDatabaseRequest.databaseName - Database name
 * @param {string} objectId - Transaction object ID
 */
export type TTransactionByIdRequest = TDatabaseRequest & {
  objectId: string;
};

/**
 * Transaction confirm request
 * @typedef TTransactionConfirmRequest
 * @param {string} TTransactionByIdRequest.databaseName - Database name
 * @param {string} TTransactionByIdRequest.objectId - Transaction object ID
 * @param {string} txHash - Transaction hash
 */
export type TTransactionConfirmRequest = TTransactionByIdRequest & {
  txHash: string;
};

import { gql } from "@apollo/client";
import {
  createMutateFunction,
  createQueryFunction,
  TApolloClient,
} from "./common.js";
import {
  TDbTransaction,
  TTransactionConfirmRequest,
  TTransactionRequest,
} from "./types/transaction.js";

const TRANSACTION_DRAFT = gql`
  query TransactionDraft(
    $databaseName: String!
    $transactionType: TransactionType!
  ) {
    transactionDraft(
      databaseName: $databaseName
      transactionType: $transactionType
    ) {
      transactionObjectId
      databaseName
      transactionType
      status
      transactionRaw
      txHash
      error
    }
  }
`;

const TRANSACTION_CONFIRM = gql`
  mutation TransactionConfirm(
    $databaseName: String!
    $transactionObjectId: String!
    $txHash: String!
  ) {
    transactionConfirm(
      databaseName: $databaseName
      transactionObjectId: $transactionObjectId
      txHash: $txHash
    )
  }
`;

export const transaction = <T>(client: TApolloClient<T>) => ({
  transactionDraft: createQueryFunction<
    TDbTransaction,
    TTransactionRequest,
    { transactionDraft: TDbTransaction }
  >(client, TRANSACTION_DRAFT, (data) => data.transactionDraft),
  transactionConfirm: createMutateFunction<
    boolean,
    TTransactionConfirmRequest,
    { confirmTransaction: boolean }
  >(client, TRANSACTION_CONFIRM, (data) => data.confirmTransaction),
});

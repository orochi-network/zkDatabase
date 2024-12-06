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

const TRANSACTION_DRAFT_GET = gql`
  query GetTransactionDraft(
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
      rawTransaction
      txHash
      error
    }
  }
`;

const TRANSACTION_CONFIRM = gql`
  mutation ConfirmTransaction(
    $databaseName: String!
    $transactionObjectId: String!
    $txHash: String!
  ) {
    confirmTransaction(
      databaseName: $databaseName
      transactionObjectId: $transactionObjectId
      txHash: $txHash
    )
  }
`;

export const transaction = <T>(client: TApolloClient<T>) => ({
  getTransactionDraft: createQueryFunction<
    TDbTransaction,
    TTransactionRequest,
    { transactionDraft: TDbTransaction }
  >(client, TRANSACTION_DRAFT_GET, (data) => data.transactionDraft),
  confirmTransaction: createMutateFunction<
    boolean,
    TTransactionConfirmRequest,
    { confirmTransaction: boolean }
  >(client, TRANSACTION_CONFIRM, (data) => data.confirmTransaction),
});

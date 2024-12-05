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

const TRANSACTION_GET = gql`
  query GetTransaction(
    $databaseName: String!
    $transactionType: TransactionType!
  ) {
    getTransaction(
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
  getTransaction: createQueryFunction<
    TDbTransaction,
    TTransactionRequest,
    { getTransaction: TDbTransaction }
  >(client, TRANSACTION_GET, (data) => data.getTransaction),
  confirmTransaction: createMutateFunction<
    boolean,
    TTransactionConfirmRequest,
    { confirmTransaction: boolean }
  >(client, TRANSACTION_CONFIRM, (data) => data.confirmTransaction),
});

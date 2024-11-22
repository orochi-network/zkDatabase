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
      databaseName
      transactionType
      status
      id
      tx
      zkAppPublicKey
    }
  }
`;

const TRANSACTION_CONFIRM = gql`
  mutation ConfirmTransaction(
    $databaseName: String!
    $confirmTransactionId: String!
    $txHash: String!
  ) {
    confirmTransaction(
      databaseName: $databaseName
      id: $confirmTransactionId
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

import { gql } from "@apollo/client";
import { createQueryFunction, TApolloClient } from "./common.js";
import { TDbTransaction, TTransactionRequest } from "./types/transaction.js";

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
      tx
      zkAppPublicKey
    }
  }
`;

export const transaction = <T>(client: TApolloClient<T>) => ({
  getTransaction: createQueryFunction<
    TDbTransaction,
    TTransactionRequest,
    { getTransaction: TDbTransaction }
  >(client, TRANSACTION_GET, (data) => data.getTransaction),
});

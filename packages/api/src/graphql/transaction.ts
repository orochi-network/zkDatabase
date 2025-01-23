import { gql } from "@apollo/client";
import {
  TTransactionDeployEnqueueRequest,
  TTransactionDeployEnqueueResponse,
  TTransactionDraftRequest,
  TTransactionDraftResponse,
  TTransactionSubmitRequest,
  TTransactionSubmitResponse,
} from "@zkdb/common";
import { createApi, TApolloClient } from "./common";

export const API_TRANSACTION = <T>(client: TApolloClient<T>) => ({
  transactionSubmit: createApi<
    TTransactionSubmitRequest,
    TTransactionSubmitResponse
  >(
    client,
    gql`
      mutation transactionSubmit(
        $databaseName: String!
        $transactionObjectId: String!
        $txHash: String!
      ) {
        transactionSubmit(
          databaseName: $databaseName
          transactionObjectId: $transactionObjectId
          txHash: $txHash
        )
      }
    `
  ),
  transactionDeployEnqueue: createApi<
    TTransactionDeployEnqueueRequest,
    TTransactionDeployEnqueueResponse
  >(
    client,
    gql`
      mutation transactionDeployEnqueue($databaseName: String!) {
        transactionDeployEnqueue(databaseName: $databaseName)
      }
    `
  ),
  transactionDraft: createApi<
    TTransactionDraftRequest,
    TTransactionDraftResponse
  >(
    client,
    gql`
      query TransactionDraft(
        $databaseName: String!
        $transactionType: TransactionType!
      ) {
        transactionDraft(
          databaseName: $databaseName
          transactionType: $transactionType
        ) {
          rawTransactionId
          databaseName
          transactionType
          status
          transactionRaw
          txHash
          error
          createdAt
          updatedAt
        }
      }
    `
  ),
});

export default API_TRANSACTION;

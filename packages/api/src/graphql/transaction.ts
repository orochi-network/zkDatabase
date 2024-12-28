import { gql } from "@apollo/client";
import {
  TTransactionDeployEnqueueRequest,
  TTransactionDeployEnqueueResponse,
  TTransactionDraftRequest,
  TTransactionDraftResponse,
  TTransactionSubmitRequest,
  TTransactionSubmitResponse,
} from "@zkdb/common";

import {
  createMutateFunction,
  createQueryFunction,
  TApolloClient,
} from "./common.js";

export const API_TRANSACTION = <T>(client: TApolloClient<T>) => ({
  transactionSubmit: createMutateFunction<
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
    `,
    (data) => data.transactionSubmit
  ),
  transactionDeployEnqueue: createMutateFunction<
    TTransactionDeployEnqueueRequest,
    TTransactionDeployEnqueueResponse
  >(
    client,
    gql`
      mutation transactionDeployEnqueue($databaseName: String!) {
        transactionDeployEnqueue(databaseName: $databaseName)
      }
    `,
    (data) => data.transactionDeployEnqueue
  ),
  transactionDraft: createQueryFunction<
    TTransactionDraftRequest,
    TTransactionDraftResponse
  >(
    client,
    gql`
      query transactionDraft(
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
          createdAt
          updatedAt
        }
      }
    `,
    (data) => data.transactionDraft
  ),
});

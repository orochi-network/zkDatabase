import { gql } from "@apollo/client";
import {
  TRollupCreateRequest,
  TRollupCreateResponse,
  TRollupHistoryRequest,
  TRollupHistoryResponse,
} from "@zkdb/common";
import { createMutateFunction, TApolloClient } from "./common.js";

export const API_ROLLUP = <T>(client: TApolloClient<T>) => ({
  rollupCreate: createMutateFunction<
    TRollupCreateRequest,
    TRollupCreateResponse
  >(
    client,
    gql`
      mutation rollupCreate($databaseName: String!) {
        rollupCreate(databaseName: $databaseName)
      }
    `,
    (data) => data.rollupCreate
  ),
  rollupHistory: createMutateFunction<
    TRollupHistoryRequest,
    TRollupHistoryResponse
  >(
    client,
    gql`
      mutation rollupHistory($databaseName: String!) {
        rollupHistory(databaseName: $databaseName) {
          state
          extraData
          history {
            databaseName
            transactionType
            txHash
            transactionRaw
            status
            merkletreeRoot
            merkletreeRootPrevious
            error
            createdAt
            updatedAt
          }
        }
      }
    `,
    (data) => data.rollUpHistory
  ),
});

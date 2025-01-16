import { gql } from "@apollo/client";

import {
  createMutateFunction,
  createQueryFunction,
  TApolloClient,
} from "./common";
import {
  TRollupOffChainHistoryRequest,
  TRollupOffChainHistoryResponse,
  TRollupOnChainCreateRequest,
  TRollupOnChainCreateResponse,
  TRollupOnChainHistoryRequest,
  TRollupOnChainHistoryResponse,
} from "@zkdb/common";
export const API_ROLLUP = <T>(client: TApolloClient<T>) => ({
  rollupCreate: createMutateFunction<
    TRollupOnChainCreateRequest,
    TRollupOnChainCreateResponse
  >(
    client,
    gql`
      mutation rollupCreate($databaseName: String!) {
        rollupCreate(databaseName: $databaseName)
      }
    `,
    (data) => data.rollupCreate
  ),
  rollupOffChainHistory: createQueryFunction<
    TRollupOffChainHistoryRequest,
    TRollupOffChainHistoryResponse
  >(
    client,
    gql`
      query RollupOffChainHistory($query: JSON, $pagination: PaginationInput) {
        rollupOffChainHistory(query: $query, pagination: $pagination) {
          data {
            databaseName
            collectionName
            merkleRootOld
            merkleRootNew
            error
            docId
            status
            step
            acquiredAt
          }
          total
          offset
        }
      }
    `,
    (data) => data.rollupOffChainHistory
  ),
  rollupOnChainHistory: createQueryFunction<
    TRollupOnChainHistoryRequest,
    TRollupOnChainHistoryResponse
  >(
    client,
    gql`
      query RollupOnChainHistory($query: JSON, $pagination: PaginationInput) {
        rollupOnChainHistory(query: $query, pagination: $pagination) {
          data {
            databaseName
            onChainStep
            merkleRootOnChainNew
            merkleRootOnChainOld
            status
            error
            txHash
          }
          total
          offset
        }
      }
    `,
    (data) => data.rollupOnChainHistory
  ),
});

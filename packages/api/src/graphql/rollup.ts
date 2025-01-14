import { gql } from "@apollo/client";
import {
  TRollupCreateRequest,
  TRollupCreateResponse,
  TRollupHistoryRequest,
  TRollupHistoryResponse,
} from "@zkdb/common";
import {
  createMutateFunction,
  createQueryFunction,
  TApolloClient,
} from "./common";

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
  rollupHistory: createQueryFunction<
    TRollupHistoryRequest,
    TRollupHistoryResponse
  >(
    client,
    gql`
      query RollupHistory($query: JSON, $pagination: PaginationInput) {
        rollupHistory(query: $query, pagination: $pagination) {
          data {
            databaseName
            txHash
            transactionRaw
            status
            merkleTreeRoot
            merkleTreeRootPrevious
            error
            createdAt
            updatedAt
          }
          total
          offset
        }
      }
    `,
    (data) => data.rollUpHistory
  ),
});

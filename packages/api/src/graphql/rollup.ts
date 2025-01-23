import { gql } from "@apollo/client";
import {
  TRollupOffChainHistoryRequest,
  TRollupOffChainHistoryResponse,
  TRollupOnChainCreateRequest,
  TRollupOnChainCreateResponse,
  TRollupOnChainHistoryRequest,
  TRollupOnChainHistoryResponse,
  TRollupOnChainStateRequest,
  TRollupOnChainStateResponse,
} from "@zkdb/common";
import { createApi, TApolloClient } from "./common";

export const API_ROLLUP = <T>(client: TApolloClient<T>) => ({
  rollupCreate: createApi<
    TRollupOnChainCreateRequest,
    TRollupOnChainCreateResponse
  >(
    client,
    gql`
      mutation rollupCreate($databaseName: String!) {
        rollupCreate(databaseName: $databaseName)
      }
    `
  ),
  rollupOffChainHistory: createApi<
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
    ({ total, data, offset }) => ({
      total,
      offset,
      data: data.map(({ step, ...e }) => ({
        ...e,
        step: BigInt(step),
      })),
    })
  ),
  rollupOnChainHistory: createApi<
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
            merkleRootNew
            merkleRootOld
            status
            error
            txHash
          }
          total
          offset
        }
      }
    `,
    ({ total, data, offset }) => ({
      total,
      offset,
      data: data.map(({ step, ...e }) => ({
        ...e,
        step: BigInt(step),
      })),
    })
  ),
  rollupOnChainState: createApi<
    TRollupOnChainStateRequest,
    TRollupOnChainStateResponse
  >(
    client,
    gql`
      query RollupState($databaseName: String!) {
        rollupState(databaseName: $databaseName) {
          databaseName
          merkleRootNew
          merkleRootOld
          rollupDifferent
          rollupOnChainState
          latestRollupOnChainSuccess
        }
      }
    `
  ),
});

export default API_ROLLUP;

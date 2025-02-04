import { gql } from "@apollo/client";
import {
  TRollupOffChainHistoryRequest,
  TRollupOffChainHistoryResponse,
  TRollupOffChainStateRequest,
  TRollupOffChainStateResponse,
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
      query RollupOffChainHistory(
        $databaseName: String!
        $pagination: PaginationInput
      ) {
        rollupOffChainHistory(
          databaseName: $databaseName
          pagination: $pagination
        ) {
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
          offset
          total
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
      query RollupOnChainHistory(
        $databaseName: String!
        $pagination: PaginationInput
      ) {
        rollupOnChainHistory(
          databaseName: $databaseName
          pagination: $pagination
        ) {
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
  rollupOffChainState: createApi<
    TRollupOffChainStateRequest,
    TRollupOffChainStateResponse
  >(
    client,
    gql`
      query RollupOffChainState($databaseName: String!) {
        rollupOffChainState(databaseName: $databaseName) {
          databaseName
          merkleRootNew
          merkleRootOld
          rollupOffChainState
          latestRollupOffChainSuccess
        }
      }
    `
  ),
});

export default API_ROLLUP;

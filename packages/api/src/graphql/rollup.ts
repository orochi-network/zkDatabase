import { gql } from "@apollo/client";
import {
  TRollUpCreateRequest,
  TRollUpCreateResponse,
  TRollupHistoryRequest,
  TRollUpHistoryResponse,
} from "@zkdb/common";
import { createMutateFunction, TApolloClient } from "./common.js";

export const rollup = <T>(client: TApolloClient<T>) => ({
  rollupCreate: createMutateFunction<
    TRollUpCreateRequest,
    TRollUpCreateResponse
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
    TRollUpHistoryResponse
  >(
    client,
    gql`
      mutation rollupHistory($databaseName: String!) {
        rollupHistory(databaseName: $databaseName) {
          state
          extraData
          history {
            ...RollUpHistoryItemFragment
          }
        }
      }
    `,
    (data) => data.rollUpHistory
  ),
});

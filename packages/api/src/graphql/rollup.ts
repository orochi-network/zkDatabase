import { gql } from "@apollo/client";
import { createMutateFunction, TApolloClient } from "./common.js";
import {
  TCreateRollUpRequest,
  TGetRollUpHistoryResponse,
} from "./types/rollup.js";

const ROLLUP_CREATE = gql`
  mutation RollupCreate($databaseName: String!) {
    rollupCreate(databaseName: $databaseName)
  }
`;

const ROLLUP_HISTORY = gql`
  mutation RollupHistory($databaseName: String!) {
    rollupHistory(databaseName: $databaseName) {
      state
      extraData
      history {
        databaseName
        transactionType
        txHash
        status
        merkletreeRootCurrent
        merkletreeRootPrevious
        createdAt
        updatedAt
        error
      }
    }
  }
`;
export const rollup = <T>(client: TApolloClient<T>) => ({
  rollupCreate: createMutateFunction<
    boolean,
    TCreateRollUpRequest,
    { rollUpCreate: boolean }
  >(client, ROLLUP_CREATE, (data) => data.rollUpCreate),
  rollupHistory: createMutateFunction<
    TGetRollUpHistoryResponse,
    TCreateRollUpRequest,
    { rollUpHistory: TGetRollUpHistoryResponse }
  >(client, ROLLUP_HISTORY, (data) => data.rollUpHistory),
});

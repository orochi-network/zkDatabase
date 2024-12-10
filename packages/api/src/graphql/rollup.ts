import { gql } from "@apollo/client";
import { RollUpData, TDatabaseRequest } from "@zkdb/common";
import { createMutateFunction, TApolloClient } from "./common.js";

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
    TDatabaseRequest,
    { rollUpCreate: boolean }
  >(client, ROLLUP_CREATE, (data) => data.rollUpCreate),
  rollupHistory: createMutateFunction<
    RollUpData,
    TDatabaseRequest,
    { rollUpHistory: RollUpData }
  >(client, ROLLUP_HISTORY, (data) => data.rollUpHistory),
});

import { gql } from "@apollo/client";
import { createMutateFunction, TApolloClient } from "./common.js";
import {
  TCreateRollUpRequest,
  TGetRollUpHistoryResponse,
} from "./types/rollup.js";

const ROLLUP_CREATE = gql`
  mutation RollUpHistoryAdd($databaseName: String!) {
    rollUpHistoryAdd(databaseName: $databaseName)
  }
`;

const ROLLUP_HISTORY = gql`
  mutation RollUpHistory($databaseName: String!) {
    rollUpCreate(databaseName: $databaseName) {
      state
      extraData
      history {
        databaseName
        transactionType
        txHash
        status
        currentMerkleTreeRoot
        previousMerkleTreeRoot
        createdAt
        error
      }
    }
  }
`;
export const rollup = <T>(client: TApolloClient<T>) => ({
  rollUpCreate: createMutateFunction<
    boolean,
    TCreateRollUpRequest,
    { rollUpCreate: boolean }
  >(client, ROLLUP_CREATE, (data) => data.rollUpCreate),
  rollUpHistory: createMutateFunction<
    TGetRollUpHistoryResponse,
    TCreateRollUpRequest,
    { rollUpHistory: TGetRollUpHistoryResponse }
  >(client, ROLLUP_HISTORY, (data) => data.rollUpHistory),
});

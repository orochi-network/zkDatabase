import { gql } from "@apollo/client";
import { createMutateFunction, TApolloClient } from "./common.js";
import {
  TCreateRollUpRequest,
  TGetRollUpHistoryResponse,
} from "./types/rollup.js";
import { TDbTransaction } from "./types/transaction.js";

const ROLLUP_CREATE = gql`
  mutation CreateRollUp($databaseName: String!) {
    createRollUp(databaseName: $databaseName) {
      databaseName
      transactionType
      status
      id
      tx
      zkAppPublicKey
      error
    }
  }
`;

const ROLLUP_HISTORY_GET = gql`
  mutation GetRollUpHistory($databaseName: String!) {
    getRollUpHistory(databaseName: $databaseName) {
      state
      extraData
      history {
        databaseName
        transactionType
        transactionHash
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
  createRollUp: createMutateFunction<
    TDbTransaction,
    TCreateRollUpRequest,
    { createRollUp: TDbTransaction }
  >(client, ROLLUP_CREATE, (data) => data.createRollUp),
  getRollUpHistory: createMutateFunction<
    TGetRollUpHistoryResponse,
    TCreateRollUpRequest,
    { getRollUpHistory: TGetRollUpHistoryResponse }
  >(client, ROLLUP_HISTORY_GET, (data) => data.getRollUpHistory),
});

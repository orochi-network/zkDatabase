import { gql } from "@apollo/client";
import {
  TProverRetryRequest,
  TProverRetryResponse,
  TProverStatusRequest,
  TProverStatusResponse,
} from "@zkdb/common";
import { createApi, TApolloClient } from "./common";

export const API_PROVER = <T>(client: TApolloClient<T>) => ({
  proverStatus: createApi<TProverStatusRequest, TProverStatusResponse>(
    client,
    gql`
      query Query($databaseName: String!) {
        proverStatus(databaseName: $databaseName)
      }
    `
  ),
  proverRetry: createApi<TProverRetryRequest, TProverRetryResponse>(
    client,
    gql`
      mutation ProverRetry($databaseName: String!) {
        proverRetry(databaseName: $databaseName)
      }
    `
  ),
});

export default API_PROVER;

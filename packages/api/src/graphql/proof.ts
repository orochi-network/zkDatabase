import { gql } from "@apollo/client";
import {
  TZkProofRequest,
  TZkProofResponse,
  TZkProofStatusRequest,
  TZkProofStatusResponse,
} from "@zkdb/common";
import { createApi, TApolloClient } from "./common";

export const API_PROOF = <T>(client: TApolloClient<T>) => ({
  zkProof: createApi<TZkProofRequest, TZkProofResponse>(
    client,
    gql`
      query ZkProof($databaseName: String!) {
        zkProof(databaseName: $databaseName) {
          step
          proof {
            publicInput
            publicOutput
            maxProofsVerified
            proof
          }
        }
      }
    `,
    (res) =>
      res
        ? {
            ...res,
            step: BigInt(res.step),
          }
        : null
  ),
  zkProofStatus: createApi<TZkProofStatusRequest, TZkProofStatusResponse>(
    client,
    gql`
      query zkProofStatus($databaseName: String!) {
        zkProofStatus(databaseName: $databaseName)
      }
    `
  ),
});

export default API_PROOF;

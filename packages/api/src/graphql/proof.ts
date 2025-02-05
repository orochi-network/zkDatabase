import { gql } from "@apollo/client";
import {
  TMerkleProofDocumentRequest,
  TMerkleProofDocumentResponse,
  TZkProofRequest,
  TZkProofResponse,
  TZkProofStatusRequest,
  TZkProofStatusResponse,
  TZkProofTaskRetryRequest,
  TZkProofTaskRetryResponse,
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
  documentMerkleProofStatus: createApi<
    TMerkleProofDocumentRequest,
    TMerkleProofDocumentResponse
  >(
    client,
    gql`
      query documentMerkleProofStatus(
        $databaseName: String!
        $collectionName: String!
        $docId: String!
      ) {
        documentMerkleProofStatus(
          databaseName: $databaseName
          collectionName: $collectionName
          docId: $docId
        )
      }
    `
  ),
  zkProofTaskRetryLatestFailed: createApi<
    TZkProofTaskRetryRequest,
    TZkProofTaskRetryResponse
  >(
    client,
    gql`
      mutation zkProofTaskRetryLatestFailed($databaseName: String!) {
        zkProofTaskRetryLatestFailed(databaseName: $databaseName)
      }
    `
  ),
});

export default API_PROOF;

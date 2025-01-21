import { gql } from "@apollo/client";
import {
  TMerkleProofDocumentRequest,
  TMerkleProofDocumentResponse,
  TZkProofRequest,
  TZkProofResponse,
  TZkProofStatusRequest,
  TZkProofStatusResponse,
} from "@zkdb/common";
import { createApi, TApolloClient } from "./common";

export const API_PROOF = <T>(client: TApolloClient<T>) => ({
  proof: createApi<TZkProofRequest, TZkProofResponse>(
    client,
    gql`
      query proof($databaseName: String!) {
        proof(databaseName: $databaseName) {
          publicInput
          publicOutput
          maxProofsVerified
          proof
        }
      }
    `
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
});

export default API_PROOF;

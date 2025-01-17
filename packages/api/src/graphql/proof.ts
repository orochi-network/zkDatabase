import { gql } from "@apollo/client";
import {
  TMerkleProofDocumentRequest,
  TMerkleProofDocumentResponse,
  TZkProofRequest,
  TZkProofResponse,
  TZkProofStatusRequest,
  TZkProofStatusResponse,
} from "@zkdb/common";
import { createQueryFunction, TApolloClient } from "./common";

export const API_PROOF = <T>(client: TApolloClient<T>) => ({
  proof: createQueryFunction<TZkProofRequest, TZkProofResponse>(
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
    `,
    (data) => data.proof,
  ),
  zkProofStatus: createQueryFunction<
    TZkProofStatusRequest,
    TZkProofStatusResponse
  >(
    client,
    gql`
      query zkProofStatus($databaseName: String!) {
        zkProofStatus(databaseName: $databaseName)
      }
    `,
    (data) => data.zkProofStatus,
  ),
  documentMerkleProofStatus: createQueryFunction<
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
    `,
    (data) => data.documentMerkleProofStatus,
  ),
});

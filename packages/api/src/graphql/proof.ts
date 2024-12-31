import { gql } from "@apollo/client";
import {
  TProofStatusDatabaseRequest,
  TProofStatusDatabaseResponse,
  TProofStatusDocumentRequest,
  TProofStatusDocumentResponse,
  TZkProofRequest,
  TZkProofResponse,
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
    (data) => data.proof
  ),
  proofStatusDatabase: createQueryFunction<
    TProofStatusDatabaseRequest,
    TProofStatusDatabaseResponse
  >(
    client,
    gql`
      query proofStatusDatabase($databaseName: String!) {
        proofStatusDatabase(databaseName: $databaseName)
      }
    `,
    (data) => data.proofStatusDatabase
  ),
  proofStatusDocument: createQueryFunction<
    TProofStatusDocumentRequest,
    TProofStatusDocumentResponse
  >(
    client,
    gql`
      query proofStatusDocument(
        $databaseName: String!
        $collectionName: String!
        $docId: String
      ) {
        proofStatusDocument(
          databaseName: $databaseName
          collectionName: $collectionName
          docId: $docId
        )
      }
    `,
    (data) => data.proofStatusDocument
  ),
});

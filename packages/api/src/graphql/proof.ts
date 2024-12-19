import { gql } from "@apollo/client";
import {
  EProofStatusDocument,
  TDatabaseRequest,
  TProofDocumentRequest,
  TZKDatabaseProof,
} from "@zkdb/common";
import { createQueryFunction, TApolloClient } from "./common";

export const proof = <T>(client: TApolloClient<T>) => ({
  status: createQueryFunction<
    EProofStatusDocument,
    TProofDocumentRequest,
    { getProofStatus: EProofStatusDocument }
  >(
    client,
    gql`
      query GetProofStatus(
        $databaseName: String!
        $collectionName: String!
        $docId: String!
      ) {
        getProofStatus(
          databaseName: $databaseName
          collectionName: $collectionName
          docId: $docId
        )
      }
    `,
    (data) => data.getProofStatus
  ),
  get: createQueryFunction<
    TZKDatabaseProof,
    TDatabaseRequest,
    { getProof: TZKDatabaseProof }
  >(
    client,
    gql`
      query GetProof($databaseName: String!) {
        getProof(databaseName: $databaseName) {
          publicInput
          publicOutput
          maxProofsVerified
          proof
        }
      }
    `,
    (data) => data.getProof
  ),
});

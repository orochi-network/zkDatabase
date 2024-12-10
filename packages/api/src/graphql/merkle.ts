import { gql } from "@apollo/client";
import { TDatabaseRequest, TMerkleProof } from "@zkdb/common";
import { createQueryFunction, TApolloClient } from "./common";

export const merkle = <T>(client: TApolloClient<T>) => ({
  root: createQueryFunction<string, TDatabaseRequest, { getRoot: string }>(
    client,
    gql`
      query GetRoot($databaseName: String!) {
        getRoot(databaseName: $databaseName)
      }
    `,
    (data) => data.getRoot
  ),
  witness: createQueryFunction<
    TMerkleProof[],
    { databaseName: string; docId: string },
    { getWitnessByDocument: TMerkleProof[] }
  >(
    client,
    gql`
      query GetWitness($databaseName: String!, $docId: String!) {
        getWitnessByDocument(databaseName: $databaseName, docId: $docId) {
          isLeft
          sibling
        }
      }
    `,
    (data) => data.getWitnessByDocument
  ),
});

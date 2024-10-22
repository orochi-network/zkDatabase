import { gql } from "@apollo/client";
import { createQueryFunction, TApolloClient } from "./common";
import { TMerkleWitness } from "./types";
import { TNetworkId } from "./types/network";

export const merkle = <T>(client: TApolloClient<T>) => ({
  root: createQueryFunction<
    string,
    { networkId: TNetworkId; databaseName: string },
    { getRoot: string }
  >(
    client,
    gql`
      query GetRoot($networkId: NetworkId!, $databaseName: String!) {
        getRoot(networkId: $networkId, databaseName: $databaseName)
      }
    `,
    (data) => data.getRoot
  ),
  witness: createQueryFunction<
    TMerkleWitness,
    { networkId: TNetworkId; databaseName: string; docId: string },
    { getWitnessByDocument: TMerkleWitness }
  >(
    client,
    gql`
      query GetWitness(
        $networkId: NetworkId!
        $databaseName: String!
        $docId: String!
      ) {
        getWitnessByDocument(
          networkId: $networkId
          databaseName: $databaseName
          docId: $docId
        ) {
          isLeft
          sibling
        }
      }
    `,
    (data) => data.getWitnessByDocument
  ),
});

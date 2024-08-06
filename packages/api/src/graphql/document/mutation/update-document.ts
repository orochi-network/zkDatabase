import pkg from '@apollo/client';
const { gql } = pkg;
import { NetworkResult, handleRequest } from "../../../utils/network.js";
import { MerkleWitness } from "../../types/merkle-tree.js";
import client from "../../client.js";
import { DocumentEncoded } from "../../types/document.js";

const UPDATE_DOCUMENT = gql`
  mutation DocumentUpdate(
    $databaseName: String!
    $collectionName: String!
    $documentQuery: JSON!
    $documentRecord: [DocumentRecordInput!]!
  ) {
    documentUpdate(
      databaseName: $databaseName
      collectionName: $collectionName
      documentQuery: $documentQuery
      documentRecord: $documentRecord
    ) {
      isLeft
      sibling
    }
  }
`;

export const updateDocument = async (
  databaseName: string,
  collectionName: string,
  documentQuery: JSON,
  documentRecord: DocumentEncoded
): Promise<NetworkResult<MerkleWitness>> => {
  return handleRequest(async () => {
    const { data, errors } = await client.mutate({
      mutation: UPDATE_DOCUMENT,
      variables: {
        databaseName,
        collectionName,
        documentQuery,
        documentRecord,
      }
    });

    const response = data?.documentUpdate;

    if (response) {
      return {
        type: "success",
        data: response as any,
      };
    } else {
      return {
        type: "error",
        message: errors?.toString() ?? "An unknown error occurred",
      };
    }
  });
};

import { gql } from "@apollo/client";
import { NetworkResult, handleRequest } from "../../../utils/network";
import { MerkleWitness } from "../../types/merkle-tree";
import client from "../../client";
import { DocumentEncoded } from "../../types/document";

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

interface DocumentResponse {
  witness: MerkleWitness;
}

export const updateDocument = async (
  databaseName: string,
  collectionName: string,
  documentQuery: JSON,
  documentRecord: DocumentEncoded,
  token: string
): Promise<NetworkResult<MerkleWitness>> => {
  return handleRequest(async () => {
    const { data, errors } = await client.mutate<{
      documentUpdate: DocumentResponse;
    }>({
      mutation: UPDATE_DOCUMENT,
      variables: {
        databaseName,
        collectionName,
        documentQuery,
        documentRecord,
      },
      context: {
        headers: {
          authorization: `Bearer ${token}`,
        },
      },
    });

    const response = data?.documentUpdate;

    if (response) {
      return {
        type: "success",
        data: response.witness,
      };
    } else {
      return {
        type: "error",
        message: errors?.toString() ?? "An unknown error occurred",
      };
    }
  });
};

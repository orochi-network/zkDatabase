import { gql } from "@apollo/client";
import { NetworkResult, handleRequest } from "../../../utils/network.js";
import { MerkleWitness } from "../../types/merkle-tree.js";
import client from "../../client.js";
import { DocumentEncoded } from "../../types/document.js";
import { Permissions } from "../../types/permission.js";

const CREATE_DOCUMENT = gql`
  mutation DocumentCreate(
    $databaseName: String!
    $collectionName: String!
    $documentRecord: [DocumentRecordInput!]!
    $documentPermission: PermissionDetailInput
  ) {
    documentCreate(
      databaseName: $databaseName
      collectionName: $collectionName
      documentRecord: $documentRecord
      documentPermission: $documentPermission
    ) {
      isLeft
      sibling
    }
  }
`;

interface DocumentResponse {
  witness: MerkleWitness;
}

export const createDocument = async (
  databaseName: string,
  collectionName: string,
  documentRecord: DocumentEncoded,
  documentPermission: Permissions,
  token: string
): Promise<NetworkResult<MerkleWitness>> => {
  return handleRequest(async () => {
    const { data, errors } = await client.mutate<{
      documentCreate: DocumentResponse;
    }>({
      mutation: CREATE_DOCUMENT,
      variables: {
        databaseName,
        collectionName,
        documentRecord,
        documentPermission,
      },
      context: {
        headers: {
          authorization: `Bearer ${token}`,
        },
      },
    });

    const response = data?.documentCreate;

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

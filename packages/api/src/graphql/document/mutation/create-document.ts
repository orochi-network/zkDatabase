import pkg from "@apollo/client";
const { gql } = pkg;
import { MerkleWitness } from "../../types/merkle-tree.js";
import client from "../../client.js";
import { DocumentEncoded } from "../../types/document.js";
import { Permissions } from "../../types/ownership.js";
import { GraphQLResult } from "../../../utils/result.js";

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

export const createDocument = async (
  databaseName: string,
  collectionName: string,
  documentRecord: DocumentEncoded,
  documentPermission: Permissions
): Promise<GraphQLResult<MerkleWitness>> => {
  try {
    const {
      data: { documentCreate },
      errors,
    } = await client.mutate({
      mutation: CREATE_DOCUMENT,
      variables: {
        databaseName,
        collectionName,
        documentRecord,
        documentPermission,
      },
    });

    if (errors) {
      return GraphQLResult.wrap<MerkleWitness>(
        Error(errors.map((error: any) => error.message).join(", "))
      );
    }

    return GraphQLResult.wrap<MerkleWitness>(documentCreate);
  } catch (error) {
    if (error instanceof Error) {
      return GraphQLResult.wrap<MerkleWitness>(error);
    } else {
      return GraphQLResult.wrap<MerkleWitness>(Error("Unknown Error"));
    }
  }
};

import pkg from "@apollo/client";
const { gql } = pkg;
import { MerkleWitness } from "../../types/merkle-tree.js";
import client from "../../client.js";
import { DocumentEncoded } from "../../types/document.js";
import { GraphQLResult } from "../../../utils/result.js";

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
): Promise<GraphQLResult<MerkleWitness>> => {
  try {
    const {
      data: { documentUpdate },
      errors,
    } = await client.mutate({
      mutation: UPDATE_DOCUMENT,
      variables: {
        databaseName,
        collectionName,
        documentQuery,
        documentRecord,
      },
    });

    if (errors) {
      return GraphQLResult.wrap<MerkleWitness>(
        Error(errors.map((error: any) => error.message).join(", "))
      );
    }

    return GraphQLResult.wrap<MerkleWitness>(documentUpdate);
  } catch (error) {
    if (error instanceof Error) {
      return GraphQLResult.wrap<MerkleWitness>(error);
    } else {
      return GraphQLResult.wrap<MerkleWitness>(Error("Unknown Error"));
    }
  }
};

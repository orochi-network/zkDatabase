import pkg from "@apollo/client";
const { gql } = pkg;
import { MerkleWitness } from "../../types/merkle-tree.js";
import client from "../../client.js";
import { GraphQLResult } from "../../../utils/result.js";

const DELETE_DOCUMENT = gql`
  mutation DocumentDrop(
    $databaseName: String!
    $collectionName: String!
    $documentQuery: JSON!
  ) {
    documentDrop(
      databaseName: $databaseName
      collectionName: $collectionName
      documentQuery: $documentQuery
    ) {
      isLeft
      sibling
    }
  }
`;

export const deleteDocument = async (
  databaseName: string,
  collectionName: string,
  documentQuery: JSON
): Promise<GraphQLResult<MerkleWitness>> => {
  try {
    const {
      data: { documentDrop },
      errors,
    } = await client.mutate({
      mutation: DELETE_DOCUMENT,
      variables: {
        databaseName,
        collectionName,
        documentQuery,
      },
    });

    if (errors) {
      return GraphQLResult.wrap<MerkleWitness>(
        Error(errors.map((error: any) => error.message).join(", "))
      );
    }

    return GraphQLResult.wrap<MerkleWitness>(documentDrop);
  } catch (error) {
    if (error instanceof Error) {
      return GraphQLResult.wrap<MerkleWitness>(error);
    } else {
      return GraphQLResult.wrap<MerkleWitness>(Error("Unknown Error"));
    }
  }
};

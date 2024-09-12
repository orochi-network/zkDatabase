import pkg from "@apollo/client";
const { gql } = pkg;
import { MerkleWitness } from "../../types/merkle-tree.js";
import client from "../../client.js";
import { GraphQLResult } from "../../../utils/result.js";

const GET_WITNESS_BY_DOCUMENT_QUERY = gql`
  query GetWitness($databaseName: String!, $docId: String!) {
    getWitnessByDocument(databaseName: $databaseName, docId: $docId) {
      isLeft
      sibling
    }
  }
`;

export const getWitnessByDocumentId = async (
  databaseName: string,
  docId: string
): Promise<GraphQLResult<MerkleWitness>> => {
  try {
    const {
      data: { getWitnessByDocument },
      errors,
    } = await client.query({
      query: GET_WITNESS_BY_DOCUMENT_QUERY,
      variables: {
        databaseName,
        docId,
      },
    });

    if (errors) {
      return GraphQLResult.wrap<MerkleWitness>(
        Error(errors.map((error: any) => error.message).join(", "))
      );
    }

    return GraphQLResult.wrap<MerkleWitness>(getWitnessByDocument);
  } catch (error) {
    if (error instanceof Error) {
      return GraphQLResult.wrap<MerkleWitness>(error);
    } else {
      return GraphQLResult.wrap<MerkleWitness>(Error("Unknown Error"));
    }
  }
};

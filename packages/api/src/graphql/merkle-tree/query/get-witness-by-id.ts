import pkg from '@apollo/client';
const { gql } = pkg;
import { NetworkResult } from "../../../utils/network.js";
import { MerkleWitness } from "../../types/merkle-tree.js";
import { handleRequest } from "../../../utils/network.js";
import client from "../../client.js";

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
): Promise<NetworkResult<MerkleWitness>> => {
  return handleRequest(async () => {
    const { data, errors } = await client.query<{
      getWitnessByDocument: MerkleWitness;
    }>({
      query: GET_WITNESS_BY_DOCUMENT_QUERY,
      variables: {
        databaseName,
        docId,
      }
    });

    const response = data?.getWitnessByDocument;

    if (response) {
      return {
        type: "success",
        data: response,
      };
    } else {
      return {
        type: "error",
        message: errors?.toString() ?? "An unknown error occurred",
      };
    }
  });
};

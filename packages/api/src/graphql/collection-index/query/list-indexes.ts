import pkg from '@apollo/client';
const { gql } = pkg;
import { NetworkResult, handleRequest } from "../../../utils/network.js";
import client from "../../client.js";

export const LIST_INDEXES = gql`
  query IndexList($databaseName: String!, $collectionName: String!) {
    indexList(databaseName: $databaseName, collectionName: $collectionName)
  }
`;

export interface ListIndexesResponse {
  indexes: string[];
}

export const listIndexes = async (
  databaseName: string,
  collectionName: string
): Promise<NetworkResult<string[]>> => {
  return handleRequest(async () => {
    const { data } = await client.query<{ indexList: ListIndexesResponse }>({
      query: LIST_INDEXES,
      variables: { databaseName, collectionName }
    });

    const response = data?.indexList;

    if (response) {
      return {
        type: "success",
        data: response.indexes,
      };
    } else {
      return {
        type: "error",
        message: "An unknown error occurred",
      };
    }
  });
};

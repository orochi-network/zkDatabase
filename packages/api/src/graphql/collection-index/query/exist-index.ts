import pkg from '@apollo/client';
const { gql } = pkg;
import { NetworkResult, handleRequest } from "../../../utils/network.js";
import client from "../../client.js";

const EXIST_INDEX = gql`
  query IndexExist(
    $databaseName: String!
    $collectionName: String!
    $indexName: String!
  ) {
    indexExist(
      databaseName: $databaseName
      collectionName: $collectionName
      indexName: $indexName
    )
  }
`;

interface ExistIndexResponse {
  existed: boolean;
}

export const existIndex = async (
  databaseName: string,
  collectionName: string,
  indexName: string
): Promise<NetworkResult<{ exist: boolean }>> => {
  return handleRequest(async () => {
    const { data } = await client.query<{ indexExist: ExistIndexResponse }>({
      query: EXIST_INDEX,
      variables: { databaseName, collectionName, indexName },
    });

    const response = data?.indexExist;

    if (response) {
      return {
        type: "success",
        data: {
          exist: response.existed,
        },
      };
    } else {
      return {
        type: "error",
        message: "An unknown error occurred",
      };
    }
  });
};

import { gql } from "@apollo/client";
import { NetworkResult, handleRequest } from "../../../utils/network";
import client from "../../client";

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

export interface ExistIndexResponse {
  existed: boolean;
}

export const deleteIndex = async (
  databaseName: string,
  collectionName: string,
  indexName: string,
  token: string
): Promise<NetworkResult<{ exist: boolean }>> => {
  return handleRequest(async () => {
    const { data } = await client.query<{ indexExist: ExistIndexResponse }>({
      query: EXIST_INDEX,
      variables: { databaseName, collectionName, indexName },
      context: {
        headers: {
          authorization: `Bearer ${token}`,
        },
      },
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

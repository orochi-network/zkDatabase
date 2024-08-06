import pkg from '@apollo/client';
const { gql } = pkg;
import { NetworkResult, handleRequest } from "../../../utils/network.js";
import client from "../../client.js";

const DELETE_INDEX = gql`
  mutation IndexDrop(
    $databaseName: String!
    $collectionName: String!
    $indexName: String!
  ) {
    indexDrop(
      databaseName: $databaseName
      collectionName: $collectionName
      indexName: $indexName
    )
  }
`;

interface DeleteIndexResponse {
  success: boolean;
}

export const deleteIndex = async (
  databaseName: string,
  collectionName: string,
  indexName: string
): Promise<NetworkResult<boolean>> => {
  return handleRequest(async () => {
    const { data } = await client.mutate<{ indexDrop: DeleteIndexResponse }>({
      mutation: DELETE_INDEX,
      variables: { databaseName, collectionName, indexName },
    });

    const response = data?.indexDrop;

    if (response && response.success) {
      return {
        type: "success",
        data: response.success,
      };
    } else {
      return {
        type: "error",
        message: "An unknown error occurred",
      };
    }
  });
};

import { gql } from "@apollo/client";
import { NetworkResult, handleRequest } from "../../../utils/network";
import client from "../../client";

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
  indexName: string,
  token: string
): Promise<NetworkResult<undefined>> => {
  return handleRequest(async () => {
    const { data } = await client.mutate<{ indexDrop: DeleteIndexResponse }>({
      mutation: DELETE_INDEX,
      variables: { databaseName, collectionName, indexName },
      context: {
        headers: {
          authorization: `Bearer ${token}`,
        },
      },
    });

    const response = data?.indexDrop;

    if (response && response.success) {
      return {
        type: "success",
        data: undefined,
      };
    } else {
      return {
        type: "error",
        message: "An unknown error occurred",
      };
    }
  });
};

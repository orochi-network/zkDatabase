import { gql } from "@apollo/client";
import { NetworkResult, handleRequest } from "../../../utils/network";
import client from "../../client";

const CREATE_INDEX = gql`
  mutation IndexCreate(
    $databaseName: String!
    $collectionName: String!
    $indexField: [String]!
  ) {
    indexCreate(
      databaseName: $databaseName
      collectionName: $collectionName
      indexField: $indexField
    )
  }
`;

interface CreateIndexResponse {
  success: boolean;
}

export const createIndexes = async (
  databaseName: string,
  collectionName: string,
  indexes: string[],
  token: string
): Promise<NetworkResult<undefined>> => {
  return handleRequest(async () => {
    const { data } = await client.mutate<{ indexCreate: CreateIndexResponse }>({
      mutation: CREATE_INDEX,
      variables: { databaseName, collectionName, indexField: indexes },
      context: {
        headers: {
          authorization: `Bearer ${token}`,
        },
      },
    });

    const response = data?.indexCreate;

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

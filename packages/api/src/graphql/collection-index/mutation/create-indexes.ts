import pkg from '@apollo/client';
const { gql } = pkg;
import { NetworkResult, handleRequest } from "../../../utils/network.js";
import client from "../../client.js";

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
  indexes: string[]
): Promise<NetworkResult<boolean>> => {
  return handleRequest(async () => {
    const { data } = await client.mutate<{ indexCreate: CreateIndexResponse }>({
      mutation: CREATE_INDEX,
      variables: { databaseName, collectionName, indexField: indexes }
    });

    const response = data?.indexCreate;

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

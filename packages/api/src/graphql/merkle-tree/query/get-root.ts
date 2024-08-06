import pkg from '@apollo/client';
const { gql } = pkg;
import { NetworkResult } from "../../../utils/network.js";
import { handleRequest } from "../../../utils/network.js";
import client from "../../client.js";

const GET_ROOT = gql`
  query GetRoot($databaseName: String!) {
    getRoot(databaseName: $databaseName)
  }
`;

export const getMerkleRoot = async (
  databaseName: string,
): Promise<NetworkResult<string>> => {
  return handleRequest(async () => {
    const { data, errors } = await client.query({
      query: GET_ROOT,
      variables: {
        databaseName
      }
    });

    const response = data?.getRoot;

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

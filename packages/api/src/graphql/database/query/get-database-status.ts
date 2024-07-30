import pkg from '@apollo/client';
const { gql } = pkg;
import client from "../../client.js";
import { DatabaseStatus } from "../../types/database.js";
import { NetworkResult, handleRequest } from "../../../utils/network.js";

const DATABASE_GET_STATUS_QUERY = gql`
  query GetDbStats($databaseName: String!) {
    dbStats(databaseName: $databaseName)
  }
`;

export const getDatabaseStatus = async (
  databaseName: string
): Promise<NetworkResult<DatabaseStatus>> => {
  return handleRequest(async () => {
    const { data, errors } = await client.query<{ dbStats: any }>({
      query: DATABASE_GET_STATUS_QUERY,
      variables: { databaseName }
    });

    const response = data?.dbStats;

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

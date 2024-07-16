import { gql } from "@apollo/client";
import client from "../../client.js";
import { DatabaseSettings } from "../../types/database.js";
import { NetworkResult, handleRequest } from "../../../utils/network.js";

const DATABASE_GET_SETTINGS_QUERY = gql`
  query GetDbSettings($databaseName: String!) {
    dbSetting(databaseName: $databaseName)
  }
`;

export const getDatabaseSettings = async (
  databaseName: string
): Promise<NetworkResult<DatabaseSettings>> => {
  return handleRequest(async () => {
    const { data, errors } = await client.query<{ dbSetting: any }>({
      query: DATABASE_GET_SETTINGS_QUERY,
      variables: { databaseName }
    });

    const response = data?.dbSetting;

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

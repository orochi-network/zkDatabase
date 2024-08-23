import pkg from '@apollo/client';
const { gql } = pkg;
import client from "../../client.js";
import { DatabaseSettings } from "../../types/database.js";
import { NetworkResult, handleRequest } from "../../../utils/network.js";

const DATABASE_GET_SETTINGS_QUERY = gql`
  query GetDbSettings($databaseName: String!) {
    dbSetting(databaseName: $databaseName) {
      merkleHeight
      publicKey
    }
  }
`;


export const getDatabaseSettings = async (
  databaseName: string
): Promise<NetworkResult<DatabaseSettings>> => {
  return handleRequest(async () => {
    try {
      const { data, errors } = await client.query<{ dbSetting: any }>({
        query: DATABASE_GET_SETTINGS_QUERY,
        variables: { databaseName }
      });

      if (errors && errors.length > 0) {
        return {
          type: "error",
          message: errors.map(e => e.message).join(", "),
        };
      }

      const response = data?.dbSetting;

      if (response) {
        return {
          type: "success",
          data: response,
        };
      } else {
        return {
          type: "error",
          message: "An unknown error occurred",
        };
      }
    } catch (error) {
      return {
        type: "error",
        message: (error as any).message ?? "An unknown error occurred",
      };
    }
  });
};
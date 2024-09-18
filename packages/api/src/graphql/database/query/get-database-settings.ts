import pkg from "@apollo/client";
const { gql } = pkg;
import client from "../../client.js";
import { DatabaseSettings } from "../../types/database.js";
import { GraphQLResult } from "../../../utils/result.js";

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
): Promise<GraphQLResult<DatabaseSettings>> => {
  try {
    const {
      data: { dbSetting },
      error,
    } = await client.query({
      query: DATABASE_GET_SETTINGS_QUERY,
      variables: { databaseName },
    });

    if (error) {
      return GraphQLResult.wrap<DatabaseSettings>(error);
    }

    return GraphQLResult.wrap(dbSetting);
  } catch (error) {
    if (error instanceof Error) {
      return GraphQLResult.wrap<DatabaseSettings>(error);
    } else {
      return GraphQLResult.wrap<DatabaseSettings>(Error("Unknown Error"));
    }
  }
};

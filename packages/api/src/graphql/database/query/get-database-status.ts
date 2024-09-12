import pkg from "@apollo/client";
const { gql } = pkg;
import client from "../../client.js";
import { DatabaseStatus } from "../../types/database.js";
import { GraphQLResult } from "../../../utils/result.js";

const DATABASE_GET_STATUS_QUERY = gql`
  query GetDbStats($databaseName: String!) {
    dbStats(databaseName: $databaseName)
  }
`;

export const getDatabaseStatus = async (
  databaseName: string
): Promise<GraphQLResult<DatabaseStatus>> => {
  try {
    const {
      data: { dbStats },
      error,
    } = await client.query({
      query: DATABASE_GET_STATUS_QUERY,
      variables: { databaseName },
    });

    if (error) {
      return GraphQLResult.wrap<DatabaseStatus>(error);
    }

    return GraphQLResult.wrap(dbStats);
  } catch (error) {
    if (error instanceof Error) {
      return GraphQLResult.wrap<DatabaseStatus>(error);
    } else {
      return GraphQLResult.wrap<DatabaseStatus>(Error("Unknown Error"));
    }
  }
};

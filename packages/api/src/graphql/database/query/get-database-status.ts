import pkg from "@apollo/client";
import { createQueryFunction } from "../../common.js";
import { TDatabaseStatus } from "../../types/database.js";
const { gql } = pkg;

/**
 * Retrieves the status of a specified database.
 *
 * This function executes a GraphQL query to fetch the database status
 * based on the provided database name.
 *
 * @function
 * @template TDatabaseStatus - The type representing the database status.
 * @param {Object} variables - The variables for the GraphQL query.
 * @param {string} variables.databaseName - The name of the database to retrieve the status for.
 * @returns {Promise<TDatabaseStatus>} - A promise that resolves to the database status.
 */
export const getDatabaseStatus = createQueryFunction<
  TDatabaseStatus,
  { databaseName: string },
  { dbStats: TDatabaseStatus }
>(
  gql`
    query GetDbStats($databaseName: String!) {
      dbStats(databaseName: $databaseName)
    }
  `,
  (data) => data.dbStats
);

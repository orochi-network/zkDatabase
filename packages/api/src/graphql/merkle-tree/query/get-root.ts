import pkg from "@apollo/client";
import {
  createQueryFunction,
  TAsyncGraphQLResult,
} from "graphql/user/common.js";
const { gql } = pkg;

/**
 * Retrieves the Merkle root for a specified database.
 *
 * @function getMerkleRoot
 * @template T - The type of the result.
 * @template Variables - The type of the variables for the query.
 * @template Data - The type of the data returned by the query.
 *
 * @param {string} databaseName - The name of the database for which to retrieve the Merkle root.
 * @returns {TAsyncGraphQLResult<string>} The Merkle root of the specified database.
 */
export const getMerkleRoot = createQueryFunction<
  string,
  { databaseName: string },
  { getRoot: string }
>(
  gql`
    query GetRoot($databaseName: String!) {
      getRoot(databaseName: $databaseName)
    }
  `,
  (data) => data.getRoot
);

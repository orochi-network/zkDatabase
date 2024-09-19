import pkg from "@apollo/client";
import {
  createQueryFunction,
  TAsyncGraphQLResult,
} from "graphql/user/common.js";
const { gql } = pkg;

/**
 * Executes a GraphQL query to list the indexes of a specified collection in a database.
 *
 * @param databaseName - The name of the database containing the collection.
 * @param collectionName - The name of the collection whose indexes are to be listed.
 * @returns {TAsyncGraphQLResult<string[]>} An object containing an array of index names.
 */
export const listIndexes = createQueryFunction<
  string[],
  { databaseName: string; collectionName: string },
  { indexList: string[] }
>(
  gql`
    query IndexList($databaseName: String!, $collectionName: String!) {
      indexList(databaseName: $databaseName, collectionName: $collectionName)
    }
  `,
  (data) => data.indexList
);

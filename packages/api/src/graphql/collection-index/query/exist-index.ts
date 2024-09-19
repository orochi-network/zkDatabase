import pkg from "@apollo/client";
import {
  createQueryFunction,
  TAsyncGraphQLResult,
} from "graphql/user/common.js";
const { gql } = pkg;

/**
 * Executes a GraphQL query to check if an index exists in a specified collection within a database.
 *
 * @function
 * @param {Object} variables - The variables for the GraphQL query.
 * @param {string} variables.databaseName - The name of the database.
 * @param {string} variables.collectionName - The name of the collection.
 * @param {string} variables.indexName - The name of the index.
 * @returns {TAsyncGraphQLResult<boolean>} A promise that resolves to a boolean indicating whether the index exists.
 */
export const existIndex = createQueryFunction<
  boolean,
  { databaseName: string; collectionName: string; indexName: string },
  { indexExist: boolean }
>(
  gql`
    query IndexExist(
      $databaseName: String!
      $collectionName: String!
      $indexName: String!
    ) {
      indexExist(
        databaseName: $databaseName
        collectionName: $collectionName
        indexName: $indexName
      )
    }
  `,
  (data) => data.indexExist
);

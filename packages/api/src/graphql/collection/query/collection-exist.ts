import pkg from "@apollo/client";
import {
  createQueryFunction,
  TAsyncGraphQLResult,
} from "graphql/user/common.js";
const { gql } = pkg;

/**
 * Checks if a collection exists within a specified database.
 *
 * @function
 * @param {Object} variables - The variables required for the query.
 * @param {string} variables.databaseName - The name of the database.
 * @param {string} variables.collectionName - The name of the collection.
 * @returns {TAsyncGraphQLResult<boolean>} - A promise that resolves to a boolean indicating whether the collection exists.
 *
 * @example
 * const exists = await collectionExist({ databaseName: 'myDatabase', collectionName: 'myCollection' });
 * console.log(exists); // true or false
 */
export const collectionExist = createQueryFunction<
  boolean,
  { databaseName: string; collectionName: string },
  { collectionExist: boolean }
>(
  gql`
    query CollectionExist($databaseName: String!, $collectionName: String!) {
      collectionExist(
        databaseName: $databaseName
        collectionName: $collectionName
      )
    }
  `,
  (data) => data.collectionExist
);

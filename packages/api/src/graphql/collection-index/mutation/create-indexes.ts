import pkg from "@apollo/client";
import {
  createMutateFunction,
  TAsyncGraphQLResult,
} from "graphql/user/common.js";
const { gql } = pkg;

/**
 * Creates indexes for a specified collection in a database.
 *
 * @function
 * @template T - The type of the mutation result.
 * @template V - The type of the mutation variables.
 * @template R - The type of the mutation response.
 *
 * @param {string} databaseName - The name of the database.
 * @param {string} collectionName - The name of the collection.
 * @param {string[]} indexes - An array of index fields to be created.
 *
 * @returns {TAsyncGraphQLResult<boolean>} - Returns true if the indexes were created successfully.
 *
 * @example
 * ```typescript
 * const result = await createIndexes({
 *   databaseName: 'myDatabase',
 *   collectionName: 'myCollection',
 *   indexes: ['field1', 'field2']
 * });
 * console.log(result); // true
 * ```
 */
export const createIndexes = createMutateFunction<
  boolean,
  { databaseName: string; collectionName: string; indexes: string[] },
  { indexCreate: boolean }
>(
  gql`
    mutation IndexCreate(
      $databaseName: String!
      $collectionName: String!
      $indexField: [String]!
    ) {
      indexCreate(
        databaseName: $databaseName
        collectionName: $collectionName
        indexField: $indexField
      )
    }
  `,
  (data) => data.indexCreate
);

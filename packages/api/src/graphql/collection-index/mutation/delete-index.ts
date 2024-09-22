import pkg from "@apollo/client";
import {
  createMutateFunction,
  TAsyncGraphQLResult,
} from "../../common.js";
const { gql } = pkg;

/**
 * Deletes an index from a specified collection in a database.
 *
 * @param databaseName - The name of the database containing the collection.
 * @param collectionName - The name of the collection containing the index.
 * @param indexName - The name of the index to be deleted.
 * @returns {TAsyncGraphQLResult<boolean>} - A boolean indicating whether the index was successfully deleted.
 */
export const deleteIndex = createMutateFunction<
  boolean,
  { databaseName: string; collectionName: string; indexName: string },
  { indexDrop: boolean }
>(
  gql`
    mutation IndexDrop(
      $databaseName: String!
      $collectionName: String!
      $indexName: String!
    ) {
      indexDrop(
        databaseName: $databaseName
        collectionName: $collectionName
        indexName: $indexName
      )
    }
  `,
  (data) => data.indexDrop
);

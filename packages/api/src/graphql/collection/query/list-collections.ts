import pkg from "@apollo/client";
import {
  createQueryFunction,
} from "../../common.js";
const { gql } = pkg;

/**
 * Retrieves a list of collections from a specified database.
 *
 * @function
 * @template T - The type of the collections array.
 * @template V - The type of the variables object.
 * @template R - The type of the response object.
 *
 * @param {string[]} T - The array of collection names.
 * @param {{ databaseName: string }} V - The variables object containing the database name.
 * @param {{ collections: string[] }} R - The response object containing the collections array.
 *
 * @param {string} databaseName - The name of the database to retrieve collections from.
 *
 * @returns {TAsyncGraphQLResult<string[]>} A promise that resolves to an array of collection names.
 */
export const listCollections = createQueryFunction<
  string[],
  { databaseName: string },
  {
    collections: string[];
  }
>(
  gql`
    query CollectionList($databaseName: String!) {
      collectionList(databaseName: $databaseName)
    }
  `,
  (data) => data.collections
);

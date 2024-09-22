import pkg from "@apollo/client";
import {
  createMutateFunction,
  TAsyncGraphQLResult,
} from "../../common.js";
import { TMerkleWitness } from "../../types/merkle-tree.js";
const { gql } = pkg;

/**
 * Deletes a document from a specified collection in a database.
 *
 * @function
 * @template TMerkleWitness - The type representing the Merkle witness.
 * @param {string} databaseName - The name of the database.
 * @param {string} collectionName - The name of the collection.
 * @param {JSON} documentQuery - The query to identify the document to be deleted.
 * @returns {TAsyncGraphQLResult<TMerkleWitness>} - A promise that resolves to the result of the document deletion, containing the Merkle witness.
 */
export const deleteDocument = createMutateFunction<
  TMerkleWitness,
  { databaseName: string; collectionName: string; documentQuery: JSON },
  { documentDrop: TMerkleWitness }
>(
  gql`
    mutation DocumentDrop(
      $databaseName: String!
      $collectionName: String!
      $documentQuery: JSON!
    ) {
      documentDrop(
        databaseName: $databaseName
        collectionName: $collectionName
        documentQuery: $documentQuery
      ) {
        isLeft
        sibling
      }
    }
  `,
  (data) => data.documentDrop
);

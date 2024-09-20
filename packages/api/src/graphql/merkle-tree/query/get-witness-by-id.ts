import pkg from "@apollo/client";
import {
  createQueryFunction,
  TAsyncGraphQLResult,
} from "graphql/user/common.js";
import { TMerkleWitness } from "../../types/merkle-tree.js";
const { gql } = pkg;

/**
 * Executes a GraphQL query to retrieve a Merkle witness by document ID.
 *
 * @function
 * @template TMerkleWitness - The type representing the Merkle witness.
 * @param {Object} variables - The variables for the GraphQL query.
 * @param {string} variables.databaseName - The name of the database.
 * @param {string} variables.docId - The ID of the document.
 * @returns {TAsyncGraphQLResult<TMerkleWitness>} The Merkle witness associated with the specified document ID.
 */
export const getWitnessByDocumentId = createQueryFunction<
  TMerkleWitness,
  { databaseName: string; docId: string },
  { getWitnessByDocument: TMerkleWitness }
>(
  gql`
    query GetWitness($databaseName: String!, $docId: String!) {
      getWitnessByDocument(databaseName: $databaseName, docId: $docId) {
        isLeft
        sibling
      }
    }
  `,
  (data) => data.getWitnessByDocument
);

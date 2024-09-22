import pkg from "@apollo/client";
import {
  createMutateFunction,
} from "../../common.js";
import { TDocumentEncoded } from "../../types/document.js";
import { TMerkleWitness } from "../../types/merkle-tree.js";
const { gql } = pkg;

/**
 * Updates a document in the specified database and collection.
 *
 * @function
 * @template TMerkleWitness - The type representing the Merkle witness.
 * @param {Object} params - The parameters for the mutation.
 * @param {string} params.databaseName - The name of the database.
 * @param {string} params.collectionName - The name of the collection.
 * @param {any} params.documentQuery - The query to find the document to update.
 * @param {TDocumentEncoded} params.documentRecord - The new document record to update.
 * @returns {TAsyncGraphQLResult<TMerkleWitness>} - The result of the document update mutation.
 */
export const updateDocument = createMutateFunction<
  TMerkleWitness,
  {
    databaseName: string;
    collectionName: string;
    documentQuery: any;
    documentRecord: TDocumentEncoded;
  },
  { documentUpdate: TMerkleWitness }
>(
  gql`
    mutation DocumentUpdate(
      $databaseName: String!
      $collectionName: String!
      $documentQuery: JSON!
      $documentRecord: [DocumentRecordInput!]!
    ) {
      documentUpdate(
        databaseName: $databaseName
        collectionName: $collectionName
        documentQuery: $documentQuery
        documentRecord: $documentRecord
      ) {
        isLeft
        sibling
      }
    }
  `,
  (data) => data.documentUpdate
);

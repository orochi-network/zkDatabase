import pkg from "@apollo/client";
import {
  createMutateFunction,
  TAsyncGraphQLResult,
} from "graphql/user/common.js";
import { TDocumentEncoded } from "../../types/document.js";
import { TMerkleWitness } from "../../types/merkle-tree.js";
import { TPermissions } from "../../types/ownership.js";
const { gql } = pkg;

/**
 * Creates a new document in the specified database and collection.
 *
 * @function
 * @template TDocumentEncoded - The type of the encoded document.
 * @param {Object} variables - The variables required for the mutation.
 * @param {string} variables.databaseName - The name of the database.
 * @param {string} variables.collectionName - The name of the collection.
 * @param {TDocumentEncoded} variables.documentRecord - The record of the document to be created.
 * @param {TPermissions} variables.documentPermission - The permissions for the document.
 * @returns {TAsyncGraphQLResult<TMerkleWitness>} The result of the document creation mutation.
 */
export const createDocument = createMutateFunction<
  TDocumentEncoded,
  {
    databaseName: string;
    collectionName: string;
    documentRecord: TDocumentEncoded;
    documentPermission: TPermissions;
  },
  { documentCreate: TMerkleWitness }
>(
  gql`
    mutation DocumentCreate(
      $databaseName: String!
      $collectionName: String!
      $documentRecord: [DocumentRecordInput!]!
      $documentPermission: PermissionDetailInput
    ) {
      documentCreate(
        databaseName: $databaseName
        collectionName: $collectionName
        documentRecord: $documentRecord
        documentPermission: $documentPermission
      ) {
        isLeft
        sibling
      }
    }
  `,
  (data) => data.documentCreate
);

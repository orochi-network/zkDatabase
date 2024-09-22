import pkg from "@apollo/client";
import {
  createQueryFunction,
  TAsyncGraphQLResult,
} from "../../common.js";
import { TDocumentPayload } from "../../types/document.js";
import { TPagination } from "../../types/pagination.js";
const { gql } = pkg;

/**
 * Executes a GraphQL query to find documents in a specified database and collection.
 *
 * @function
 * @template TDocumentPayload - The type of the document payload.
 * @param {Object} variables - The variables for the query.
 * @param {string} variables.databaseName - The name of the database.
 * @param {string} variables.collectionName - The name of the collection.
 * @param {any} variables.documentQuery - The query to filter documents.
 * @param {TPagination} [variables.pagination] - Optional pagination parameters.
 * @returns {TAsyncGraphQLResult<TDocumentPayload>} The result of the query containing the found documents.
 */
export const findDocuments = createQueryFunction<
  TDocumentPayload[],
  {
    databaseName: string;
    collectionName: string;
    documentQuery: any;
    pagination?: TPagination;
  },
  { documentsFind: Array<TDocumentPayload> }
>(
  gql`
    query DocumentsFind(
      $databaseName: String!
      $collectionName: String!
      $documentQuery: JSON!
      $pagination: PaginationInput
    ) {
      documentsFind(
        databaseName: $databaseName
        collectionName: $collectionName
        documentQuery: $documentQuery
        pagination: $pagination
      ) {
        docId
        fields {
          name
          kind
          value
        }
        createdAt
      }
    }
  `,
  (data) => data.documentsFind
);

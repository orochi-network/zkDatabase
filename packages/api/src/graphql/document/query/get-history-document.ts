import pkg from "@apollo/client";
import {
  createQueryFunction,
  TAsyncGraphQLResult,
} from "../../common.js";
import { TDocumentHistoryPayload } from "../../types/document-history.js";
const { gql } = pkg;

/**
 * Retrieves the history of a specific document from a specified database and collection.
 *
 * @function
 * @template TDocumentHistoryPayload - The payload type for the document history.
 * @param {Object} variables - The variables required for the query.
 * @param {string} variables.databaseName - The name of the database.
 * @param {string} variables.collectionName - The name of the collection.
 * @param {string} variables.docId - The ID of the document.
 * @returns {TAsyncGraphQLResult<TDocumentHistoryPayload>} The document history payload.
 *
 * @example
 * const history = await getDocumentHistory({
 *   databaseName: 'myDatabase',
 *   collectionName: 'myCollection',
 *   docId: '12345'
 * });
 * console.log(history);
 */
export const getDocumentHistory = createQueryFunction<
  TDocumentHistoryPayload,
  { databaseName: string; collectionName: string; docId: string },
  { historyDocumentGet: TDocumentHistoryPayload }
>(
  gql`
    query HistoryDocumentGet(
      $databaseName: String!
      $collectionName: String!
      $docId: String!
    ) {
      historyDocumentGet(
        databaseName: $databaseName
        collectionName: $collectionName
        docId: $docId
      ) {
        docId
        documents {
          docId
          fields {
            name
            kind
            value
          }
          createdAt
        }
      }
    }
  `,
  (data) => data.historyDocumentGet
);

import pkg from "@apollo/client";
import {
  createQueryFunction,
  TAsyncGraphQLResult,
} from "graphql/user/common.js";
import { TDocumentPayload } from "../../types/document.js";
const { gql } = pkg;

/**
 * Executes a GraphQL query to find a document in a specified database and collection.
 *
 * @function
 * @template TDocumentPayload - The type of the document payload.
 * @param {Object} variables - The variables for the GraphQL query.
 * @param {string} variables.databaseName - The name of the database.
 * @param {string} variables.collectionName - The name of the collection.
 * @param {any} variables.documentQuery - The query to find the document.
 * @returns {TAsyncGraphQLResult<TDocumentPayload>} The found document payload.
 *
 * @example
 * const result = await findDocument({
 *   databaseName: 'myDatabase',
 *   collectionName: 'myCollection',
 *   documentQuery: { _id: '12345' }
 * });
 * console.log(result.documentFind);
 */
export const findDocument = createQueryFunction<
  TDocumentPayload,
  { databaseName: string; collectionName: string; documentQuery: any },
  { documentFind: TDocumentPayload }
>(
  gql`
    query DocumentFind(
      $databaseName: String!
      $collectionName: String!
      $documentQuery: JSON!
    ) {
      documentFind(
        databaseName: $databaseName
        collectionName: $collectionName
        documentQuery: $documentQuery
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
  (data) => data.documentFind
);

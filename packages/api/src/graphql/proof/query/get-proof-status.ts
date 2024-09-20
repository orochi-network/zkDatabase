import pkg from "@apollo/client";
import {
  createMutateFunction,
  TAsyncGraphQLResult,
} from "graphql/user/common.js";
import { TProofStatus, TProofStatusRequest } from "../../types/proof.js";
const { gql } = pkg;

/**
 * Retrieves the proof status for a specified document within a collection in a database.
 *
 * @function
 * @template TProofStatus - The type representing the proof status.
 * @template TProofStatusRequest - The type representing the request parameters for the proof status.
 * @param {string} databaseName - The name of the database.
 * @param {string} collectionName - The name of the collection within the database.
 * @param {string} docId - The ID of the document for which the proof status is being requested.
 * @returns {TAsyncGraphQLResult<TProofStatus>} - The proof status of the specified document.
 */
export const getProofStatus = createMutateFunction<
  TProofStatus,
  TProofStatusRequest,
  { getProofStatus: TProofStatus }
>(
  gql`
    query GetProofStatus(
      $databaseName: String!
      $collectionName: String!
      $docId: String!
    ) {
      getProofStatus(
        databaseName: $databaseName
        collectionName: $collectionName
        docId: $docId
      )
    }
  `,
  (data) => data.getProofStatus
);

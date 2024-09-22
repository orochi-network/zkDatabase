import pkg from "@apollo/client";
import {
  createMutateFunction,
  TAsyncGraphQLResult,
} from "../../common.js";
const { gql } = pkg;

/**
 * Creates a new database using the provided parameters.
 *
 * @function
 * @template T - The type of the mutation result.
 * @template V - The type of the variables for the mutation.
 * @template R - The type of the response data.
 *
 * @param {string} databaseName - The name of the database to be created.
 * @param {number} merkleHeight - The merkle height of the database.
 * @param {string} publicKey - The public key associated with the database.
 *
 * @returns {TAsyncGraphQLResult<boolean>} - A boolean indicating whether the database was successfully created.
 */
export const createDatabase = createMutateFunction<
  boolean,
  { databaseName: string; merkleHeight: number; publicKey: string },
  { dbCreate: boolean }
>(
  gql`
    mutation DbCreate(
      $databaseName: String!
      $merkleHeight: Int!
      $publicKey: String!
    ) {
      dbCreate(
        databaseName: $databaseName
        merkleHeight: $merkleHeight
        publicKey: $publicKey
      )
    }
  `,
  (data) => data.dbCreate
);

import pkg from "@apollo/client";
import {
  createMutateFunction,
  TAsyncGraphQLResult,
} from "graphql/user/common.js";
const { gql } = pkg;

/**
 * Changes the owner of a specified database.
 *
 * This function uses a GraphQL mutation to change the owner of a database.
 * It takes the database name and the new owner's identifier as input parameters
 * and returns a boolean indicating the success of the operation.
 *
 * @param {string} databaseName - The name of the database whose owner is to be changed.
 * @param {string} newOwner - The identifier of the new owner.
 * @returns {TAsyncGraphQLResult<boolean>} - A promise that resolves to a boolean indicating whether the owner change was successful.
 */
export const changeDatabaseOwner = createMutateFunction<
  boolean,
  { databaseName: string; newOwner: string },
  { dbChangeOwner: boolean }
>(
  gql`
    mutation DbChangeOwner($databaseName: String!, $newOwner: String!) {
      dbChangeOwner(databaseName: $databaseName, newOwner: $newOwner)
    }
  `,
  (data) => data.dbChangeOwner
);

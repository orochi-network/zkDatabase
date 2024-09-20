import pkg from "@apollo/client";
import {
  createQueryFunction,
  TAsyncGraphQLResult,
} from "graphql/user/common.js";
const { gql } = pkg;

/**
 * Executes a GraphQL query to retrieve a list of groups associated with a specific user.
 *
 * @function
 * @template T - The type of the query result.
 * @param {string} query - The GraphQL query string.
 * @param {Object} variables - The variables to be passed to the GraphQL query.
 * @param {string} variables.databaseName - The name of the database.
 * @param {string} variables.userName - The name of the user.
 * @returns {TAsyncGraphQLResult<string>} - A promise that resolves to an object containing the list of groups associated with the user.
 */
export const listGroupsByUser = createQueryFunction<
  string[],
  { databaseName: string; userName: string },
  { groupListByUser: string[] }
>(
  gql`
    query GroupListByUser($databaseName: String!, $userName: String!) {
      groupListByUser(databaseName: $databaseName, userName: $userName)
    }
  `,
  (data) => data.groupListByUser
);

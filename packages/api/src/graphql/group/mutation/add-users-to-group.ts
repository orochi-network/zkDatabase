import pkg from "@apollo/client";
import {
  createMutateFunction,
  TAsyncGraphQLResult,
} from "graphql/user/common.js";
const { gql } = pkg;

/**
 * Adds users to a specified group in the database.
 *
 * @function
 * @param {Object} variables - The input variables for the mutation.
 * @param {string} variables.databaseName - The name of the database.
 * @param {string} variables.groupName - The name of the group.
 * @param {string[]} variables.userNames - An array of usernames to be added to the group.
 * @returns {TAsyncGraphQLResult<boolean>} - A promise that resolves to a boolean indicating the success of the operation.
 */
export const addUsersToGroup = createMutateFunction<
  boolean,
  { databaseName: string; groupName: string; userNames: string[] },
  { groupAddUsers: boolean }
>(
  gql`
    mutation GroupAddUsers(
      $databaseName: String!
      $groupName: String!
      $userNames: [String!]!
    ) {
      groupAddUsers(
        databaseName: $databaseName
        groupName: $groupName
        userNames: $userNames
      )
    }
  `,
  (data) => data.groupAddUsers
);

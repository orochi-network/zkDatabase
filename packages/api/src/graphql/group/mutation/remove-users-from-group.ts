import pkg from "@apollo/client";
import {
  createMutateFunction,
  TAsyncGraphQLResult,
} from "graphql/user/common.js";
const { gql } = pkg;

/**
 * Removes users from a specified group in the given database.
 *
 * @function
 * @param {Object} variables - The input variables for the mutation.
 * @param {string} variables.databaseName - The name of the database.
 * @param {string} variables.groupName - The name of the group.
 * @param {string[]} variables.userNames - An array of usernames to be removed from the group.
 * @returns {TAsyncGraphQLResult<boolean>} - A promise that resolves to a boolean indicating the success of the operation.
 */
export const removeUsersFromGroup = createMutateFunction<
  boolean,
  { databaseName: string; groupName: string; userNames: string[] },
  { groupRemoveUsers: boolean }
>(
  gql`
    mutation GroupRemoveUsers(
      $databaseName: String!
      $groupName: String!
      $userNames: [String!]!
    ) {
      groupRemoveUsers(
        databaseName: $databaseName
        groupName: $groupName
        userNames: $userNames
      )
    }
  `,
  (data) => data.groupRemoveUsers
);

import pkg from "@apollo/client";
import {
  createMutateFunction,
  TAsyncGraphQLResult,
} from "graphql/user/common.js";
const { gql } = pkg;

/**
 * Changes the description of a specified group within a given database.
 *
 * @function
 * @template T - The return type of the mutation function, which is a boolean indicating success.
 * @template V - The variables required for the mutation, including:
 *   - `databaseName`: The name of the database containing the group.
 *   - `groupName`: The name of the group whose description is to be changed.
 *   - `groupDescription`: The new description for the group.
 * @template R - The response type from the GraphQL mutation, which includes:
 *   - `groupChangeDescription`: A boolean indicating whether the description change was successful.
 *
 * @param {string} databaseName - The name of the database containing the group.
 * @param {string} groupName - The name of the group whose description is to be changed.
 * @param {string} groupDescription - The new description for the group.
 * @returns {TAsyncGraphQLResult<boolean>} - A promise that resolves to a boolean indicating whether the description change was successful.
 */
export const changeGroupDescription = createMutateFunction<
  boolean,
  { databaseName: string; groupName: string; groupDescription: string },
  { groupChangeDescription: boolean }
>(
  gql`
    mutation GroupChangeDescription(
      $databaseName: String!
      $groupName: String!
      $groupDescription: String!
    ) {
      groupChangeDescription(
        databaseName: $databaseName
        groupName: $groupName
        groupDescription: $groupDescription
      )
    }
  `,
  (data) => data.groupChangeDescription
);

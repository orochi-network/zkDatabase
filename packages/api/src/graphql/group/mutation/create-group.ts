import pkg from "@apollo/client";
import {
  createMutateFunction,
  TAsyncGraphQLResult,
} from "graphql/user/common.js";
const { gql } = pkg;

/**
 * Creates a new group in the specified database.
 *
 * @function
 * @template T - The return type of the mutation function.
 * @template V - The variables required for the mutation.
 * @template R - The response type of the mutation.
 *
 * @param {string} databaseName - The name of the database where the group will be created.
 * @param {string} groupName - The name of the group to be created.
 * @param {string} groupDescription - A description of the group to be created.
 *
 * @returns {TAsyncGraphQLResult<boolean>} - Returns true if the group was successfully created.
 *
 * @example
 * ```typescript
 * const result = await createGroup({
 *   databaseName: 'exampleDB',
 *   groupName: 'exampleGroup',
 *   groupDescription: 'example'
 * });
 * console.log(result); // true if the group was created successfully
 * ```
 */
export const createGroup = createMutateFunction<
  boolean,
  { databaseName: string; groupName: string; groupDescription: string },
  { groupCreate: boolean }
>(
  gql`
    mutation GroupCreate(
      $databaseName: String!
      $groupName: String!
      $groupDescription: String
    ) {
      groupCreate(
        databaseName: $databaseName
        groupName: $groupName
        groupDescription: $groupDescription
      )
    }
  `,
  (data) => data.groupCreate
);

import pkg from "@apollo/client";
import { createMutateFunction } from "graphql/user/common.js";
const { gql } = pkg;

/**
 * Renames a group within a specified database.
 *
 * @param databaseName - The name of the database containing the group to be renamed.
 * @param groupName - The current name of the group to be renamed.
 * @param newGroupName - The new name for the group.
 * @returns A boolean indicating whether the group was successfully renamed.
 */
export const renameGroup = createMutateFunction<
  boolean,
  { databaseName: string; groupName: string; newGroupName: string },
  { groupRename: boolean }
>(
  gql`
    mutation GroupRename(
      $databaseName: String!
      $groupName: String!
      $newGroupName: String!
    ) {
      groupRename(
        databaseName: $databaseName
        groupName: $groupName
        newGroupName: $newGroupName
      )
    }
  `,
  (data) => data.groupRename
);

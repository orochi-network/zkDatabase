import pkg from "@apollo/client";
import {
  createQueryFunction,
  TAsyncGraphQLResult,
} from "../../common.js";
import { TGroupInfo } from "../../types/group.js";
const { gql } = pkg;

/**
 * Retrieves the description of a group from the database.
 *
 * @function
 * @template TGroupInfo - The type of the group information.
 * @param {Object} variables - The variables required for the query.
 * @param {string} variables.databaseName - The name of the database.
 * @param {string} variables.groupName - The name of the group.
 * @returns {TAsyncGraphQLResult<TGroupInfo>} The group information.
 */
export const getGroupDescription = createQueryFunction<
  TGroupInfo,
  { databaseName: string; groupName: string },
  { groupInfo: TGroupInfo }
>(
  gql`
    mutation GroupInfo($databaseName: String!, $groupName: String!) {
      groupInfo(databaseName: $databaseName, groupName: $groupName)
    }
  `,
  (data) => data.groupInfo
);

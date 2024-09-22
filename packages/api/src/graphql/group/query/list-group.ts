import pkg from "@apollo/client";
import {
  createQueryFunction,
} from "../../common.js";
import { TGroupInfo } from "../../types/group.js";
const { gql } = pkg;

/**
 * Fetches a list of all groups from the specified database.
 *
 * @function
 * @template TGroupInfo - The type representing the group information.
 * @param {Object} variables - The variables required for the query.
 * @param {string} variables.databaseName - The name of the database from which to fetch the groups.
 * @returns {TAsyncGraphQLResult<TGroupInfo[]>} A promise that resolves to the list of group information.
 */
export const listGroups = createQueryFunction<
  TGroupInfo[],
  { databaseName: string },
  { groupListAll: TGroupInfo[] }
>(
  gql`
    query GroupListAll($databaseName: String!) {
      groupListAll(databaseName: $databaseName)
    }
  `,
  (data) => data.groupListAll
);

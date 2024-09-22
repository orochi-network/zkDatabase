import pkg from "@apollo/client";
import {
  createQueryFunction,
  TAsyncGraphQLResult,
} from "../../common.js";
import { TDatabase } from "../../types/database.js";
import { TPagination } from "../../types/pagination.js";
import { TSearch } from "../../types/search.js";
const { gql } = pkg;

/**
 * Executes a GraphQL query to retrieve a list of databases with optional search and pagination parameters.
 *
 * @function listDatabases
 * @template TDatabase - The type representing a database.
 * @template TSearch - The type representing the search input.
 * @template TPagination - The type representing the pagination input.
 * @param {TSearch} search - The search criteria for filtering the databases.
 * @param {TPagination} pagination - The pagination information for retrieving the databases.
 * @returns {TAsyncGraphQLResult<TDatabase>} - A promise that resolves to an object containing the list of databases.
 *
 * @example
 * ```typescript
 * const search: TSearch = { name: 'example' };
 * const pagination: TPagination = { limit: 10, offset: 0 };
 * const result = await listDatabases(search, pagination);
 * console.log(result.dbList);
 * ```
 */
export const listDatabases = createQueryFunction<
  TDatabase[],
  { query: any; pagination: TPagination },
  { dbList: TDatabase[] }
>(
  gql`
    query GetDbList($query: JSON, $pagination: PaginationInput) {
      dbList(query: $query, pagination: $pagination) {
        databaseName
        databaseSize
        merkleHeight
        collections
      }
    }
  `,
  (data) => data.dbList
);

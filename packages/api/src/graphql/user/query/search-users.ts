import pkg from "@apollo/client";
import { TPagination } from "../../types/pagination.js";
import { TSearch } from "../../types/search.js";
import { TUser } from "../../types/user.js";
import { createQueryFunction } from "../common.js";
const { gql } = pkg;

/**
 * Executes a GraphQL query to search for users based on the provided search criteria and pagination options.
 *
 * @function
 * @template TUser - The type representing a user.
 * @template TSearch - The type representing the search criteria.
 * @template TPagination - The type representing the pagination options.
 * @param {Search} search - The search criteria input.
 * @param {Pagination} pagination - The pagination options input.
 * @returns {TAsyncGraphQLResult<TUser>} - A promise that resolves to an object containing the search results.
 */
export const searchUsers = createQueryFunction<
  TUser,
  { search: TSearch; pagination: TPagination },
  { searchUser: TUser }
>(
  gql`
    query SearchUser($search: SearchInput, $pagination: PaginationInput) {
      searchUser(search: $search, pagination: $pagination) {
        email
        publicKey
        userName
      }
    }
  `,
  (data) => data.searchUser
);

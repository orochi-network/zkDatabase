import pkg from "@apollo/client";
const { gql } = pkg;
import { Search } from "../../types/search.js";
import client from "../../client.js";
import { NetworkResult } from "../../../utils/network.js";
import { Pagination } from "../../types/pagination.js";
import { User } from "../../types/user.js";

const SEARCH_USERS = gql`
  query SearchUser($search: SearchInput, $pagination: PaginationInput) {
    searchUser(search: $search, pagination: $pagination) {
      email
      publicKey
      userName
    }
  }
`;

export async function searchUsers(
  search?: Search | undefined,
  pagination?: Pagination | undefined
): Promise<NetworkResult<User[]>> {
  try {
    const { data } = await client.query({
      query: SEARCH_USERS,
      variables: [search, pagination],
    });

    const response = data?.searchUser;

    if (response) {
      return {
        type: "success",
        data: response,
      };
    } else {
      return {
        type: "error",
        message: response?.error ?? "An unknown error occurred",
      };
    }
  } catch (error) {
    console.log('error', error)
    return {
      type: "error",
      message: `${(error as any).message}` ?? "An unknown error occurred",
    };
  }
}

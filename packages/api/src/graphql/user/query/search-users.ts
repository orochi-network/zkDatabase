import pkg from "@apollo/client";
const { gql } = pkg;
import { Search } from "../../types/search.js";
import client from "../../client.js";
import { Pagination } from "../../types/pagination.js";
import { User } from "../../types/user.js";
import { GraphQLResult } from "../../../utils/result.js";

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
): Promise<GraphQLResult<User>> {
  try {
    const {
      data: { searchUser },
      errors,
    } = await client.query({
      query: SEARCH_USERS,
      variables: [search, pagination],
    });

    if (errors) {
      return GraphQLResult.wrap<User>(
        Error(errors.map((error: any) => error.message).join(", "))
      );
    }

    return GraphQLResult.wrap<User>(searchUser);
  } catch (error) {
    if (error instanceof Error) {
      return GraphQLResult.wrap<User>(error);
    } else {
      return GraphQLResult.wrap<User>(Error("Unknown Error"));
    }
  }
}

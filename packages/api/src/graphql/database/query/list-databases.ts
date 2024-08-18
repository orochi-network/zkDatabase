import pkg from "@apollo/client";
const { gql } = pkg;
import { Database } from "../../types/database.js";
import client from "../../client.js";
import { NetworkResult, handleRequest } from "../../../utils/network.js";
import { Search } from "../../types/search.js";
import { Pagination } from "../../types/pagination.js";

const LIST_DATABASES = gql`
  query GetDbList($search: SearchInput, $pagination: PaginationInput) {
    dbList(search: $search, pagination: $pagination) {
      databaseName
      databaseSize
      merkleHeight
      collections
    }
  }
`;

export const listDatabases = async (
  search?: Search | undefined,
  pagination?: Pagination | undefined
): Promise<NetworkResult<Database[]>> => {
  return handleRequest(async () => {
    const { data, errors } = await client.query({
      query: LIST_DATABASES,
      variables: [search, pagination],
    });

    const response = data?.dbList;

    if (response) {
      return {
        type: "success",
        data: response,
      };
    } else {
      return {
        type: "error",
        message: errors?.toString() ?? "An unknown error occurred",
      };
    }
  });
};

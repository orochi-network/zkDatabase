import pkg from "@apollo/client";
const { gql } = pkg;
import { Database } from "../../types/database.js";
import client from "../../client.js";
import { Search } from "../../types/search.js";
import { Pagination } from "../../types/pagination.js";
import { GraphQLResult } from "../../../utils/result.js";

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
): Promise<GraphQLResult<Database>> => {
  try {
    const {
      data: { dbList },
      error,
    } = await client.query({
      query: LIST_DATABASES,
      variables: [search, pagination],
    });

    if (error) {
      return GraphQLResult.wrap<Database>(error);
    }

    return GraphQLResult.wrap(dbList);
  } catch (error) {
    if (error instanceof Error) {
      return GraphQLResult.wrap<Database>(error);
    } else {
      return GraphQLResult.wrap<Database>(Error("Unknown Error"));
    }
  }
};

import pkg from "@apollo/client";
const { gql } = pkg;
import { NetworkResult, handleRequest } from "../../../utils/network.js";
import client from "../../client.js";
import { DocumentEncoded } from "../../types/document.js";
import { Search } from "../../types/search.js";
import { Pagination } from "../../types/pagination.js";

const SEARCH_DOCUMENTS = gql`
  query SearchDocument(
    $databaseName: String!
    $collectionName: String!
    $search: SearchInput
    $pagination: PaginationInput
  ) {
    searchDocument(
      databaseName: $databaseName
      collectionName: $collectionName
      search: $search
      pagination: $pagination
    ) {
      _id
      document {
        name
        kind
        value
      }
    }
  }
`;

export const searchDocument = async (
  databaseName: string,
  collectionName: string,
  search?: Search | undefined,
  pagination?: Pagination | undefined
): Promise<
  NetworkResult<Array<{ _id: string; document: DocumentEncoded }>>
> => {
  return handleRequest(async () => {
    const { data, errors } = await client.query({
      query: SEARCH_DOCUMENTS,
      variables: {
        databaseName,
        collectionName,
        search,
        pagination,
      },
    });

    const response = data?.searchDocument;
    
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

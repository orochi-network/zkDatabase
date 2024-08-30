import pkg from "@apollo/client";
const { gql } = pkg;
import { NetworkResult, handleRequest } from "../../../utils/network.js";
import client from "../../client.js";
import { DocumentEncoded, DocumentPayload } from "../../types/document.js";
import { Search } from "../../types/search.js";
import { Pagination } from "../../types/pagination.js";

const SEARCH_DOCUMENTS = gql`
  query DocumentsFind(
    $databaseName: String!
    $collectionName: String!
    $search: SearchInput
    $pagination: PaginationInput
  ) {
    documentsFind(
      databaseName: $databaseName
      collectionName: $collectionName
      search: $search
      pagination: $pagination
    ) {
      docId
      fields {
        name
        kind
        value
      }
    }
  }
`;

export const findDocuments = async (
  databaseName: string,
  collectionName: string,
  documentQuery: JSON,
  pagination?: Pagination
): Promise<
  NetworkResult<Array<DocumentPayload>>
> => {
  return handleRequest(async () => {
    const { data, errors } = await client.query({
      query: SEARCH_DOCUMENTS,
      variables: {
        databaseName,
        collectionName,
        documentQuery,
        pagination,
      },
    });

    const response = data?.documentsFind;
    
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

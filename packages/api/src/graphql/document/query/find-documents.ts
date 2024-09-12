import pkg from "@apollo/client";
const { gql } = pkg;
import client from "../../client.js";
import { DocumentPayload } from "../../types/document.js";
import { Pagination } from "../../types/pagination.js";
import { GraphQLResult } from "../../../utils/result.js";

const SEARCH_DOCUMENTS = gql`
  query DocumentsFind(
    $databaseName: String!
    $collectionName: String!
    $documentQuery: JSON!
    $pagination: PaginationInput
  ) {
    documentsFind(
      databaseName: $databaseName
      collectionName: $collectionName
      documentQuery: $documentQuery
      pagination: $pagination
    ) {
      docId
      fields {
        name
        kind
        value
      }
      createdAt
    }
  }
`;

export const findDocuments = async (
  databaseName: string,
  collectionName: string,
  documentQuery: JSON,
  pagination?: Pagination
): Promise<GraphQLResult<DocumentPayload>> => {
  try {
    const {
      data: { documentsFind },
      error,
    } = await client.query({
      query: SEARCH_DOCUMENTS,
      variables: {
        databaseName,
        collectionName,
        documentQuery,
        pagination,
      },
    });

    if (error) {
      return GraphQLResult.wrap<DocumentPayload>(error);
    }

    return GraphQLResult.wrap(documentsFind);
  } catch (error) {
    if (error instanceof Error) {
      return GraphQLResult.wrap<DocumentPayload>(error);
    } else {
      return GraphQLResult.wrap<DocumentPayload>(Error("Unknown Error"));
    }
  }
};

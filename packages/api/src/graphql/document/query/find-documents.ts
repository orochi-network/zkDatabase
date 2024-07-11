import { gql } from "@apollo/client";
import { NetworkResult, handleRequest } from "../../../utils/network.js";
import client from "../../client.js";
import { DocumentEncoded } from "../../types/document.js";

const FIND_DOCUMENT = gql`
  query DocumentFind(
    $databaseName: String!
    $collectionName: String!
    $documentQuery: JSON!
  ) {
    documentFind(
      databaseName: $databaseName
      collectionName: $collectionName
      documentQuery: $documentQuery
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

interface DocumentResponse {
  _id: string;
  document: DocumentEncoded;
}

export const findDocument = async (
  databaseName: string,
  collectionName: string,
  documentQuery: JSON,
  token: string
): Promise<NetworkResult<{ _id: string; document: DocumentEncoded }>> => {
  return handleRequest(async () => {
    const { data, errors } = await client.query<{
      documentFind: DocumentResponse;
    }>({
      query: FIND_DOCUMENT,
      variables: {
        databaseName,
        collectionName,
        documentQuery,
      },
      context: {
        headers: {
          authorization: `Bearer ${token}`,
        },
      },
    });

    const response = data?.documentFind;

    if (response) {
      return {
        type: "success",
        data: {
          _id: response._id,
          document: response.document,
        },
      };
    } else {
      return {
        type: "error",
        message: errors?.toString() ?? "An unknown error occurred",
      };
    }
  });
};

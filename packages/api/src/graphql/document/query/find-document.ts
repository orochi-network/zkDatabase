import pkg from '@apollo/client';
const { gql } = pkg;
import { NetworkResult, handleRequest } from "../../../utils/network.js";
import client from "../../client.js";
import { DocumentEncoded, DocumentPayload } from "../../types/document.js";

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

export const findDocument = async (
  databaseName: string,
  collectionName: string,
  documentQuery: JSON
): Promise<NetworkResult<DocumentPayload>> => {
  return handleRequest(async () => {
    const { data, errors } = await client.query({
      query: FIND_DOCUMENT,
      variables: {
        databaseName,
        collectionName,
        documentQuery,
      }
    });

    const response = data?.documentFind;

    const payload: DocumentPayload = {
      docId: response.docId,
      fields: response.fields,
      createdAt: response.fields
    }

    if (response) {
      return {
        type: "success",
        data: payload,
      };
    } else {
      return {
        type: "error",
        message: errors?.toString() ?? "An unknown error occurred",
      };
    }
  });
};

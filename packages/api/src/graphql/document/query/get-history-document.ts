import pkg from '@apollo/client';
const { gql } = pkg;
import { NetworkResult, handleRequest } from "../../../utils/network.js";
import client from "../../client.js";
import { DocumentEncoded, DocumentPayload } from "../../types/document.js";
import { DocumentHistoryPayload } from '../../types/document-history.js';

const GET_DOCUMENT_HISTORY = gql`
  query HistoryDocumentGet(
    $databaseName: String!
    $collectionName: String!
    $docId: String!
  ) {
    historyDocumentGet(
      databaseName: $databaseName
      collectionName: $collectionName
      docId: $docId
    ) {
      docId,
      documents {
        docId
        fields {
          name
          kind
          value
        }
        createdAt
      }
    }
  }
`;

export const getDocumentHistory = async (
  databaseName: string,
  collectionName: string,
  docId: string
): Promise<NetworkResult<DocumentHistoryPayload>> => {
  return handleRequest(async () => {
    const { data, errors } = await client.query({
      query: GET_DOCUMENT_HISTORY,
      variables: {
        databaseName,
        collectionName,
        docId,
      }
    });

    const response = data?.historyDocumentGet;

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

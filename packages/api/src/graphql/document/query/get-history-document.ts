import pkg from "@apollo/client";
const { gql } = pkg;
import client from "../../client.js";
import { DocumentHistoryPayload } from "../../types/document-history.js";
import { GraphQLResult } from "../../../utils/result.js";

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
      docId
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
): Promise<GraphQLResult<DocumentHistoryPayload>> => {
  try {
    const {
      data: { historyDocumentGet },
      error,
    } = await client.query({
      query: GET_DOCUMENT_HISTORY,
      variables: {
        databaseName,
        collectionName,
        docId,
      },
    });

    if (error) {
      return GraphQLResult.wrap<DocumentHistoryPayload>(error);
    }

    return GraphQLResult.wrap(historyDocumentGet);
  } catch (error) {
    if (error instanceof Error) {
      return GraphQLResult.wrap<DocumentHistoryPayload>(error);
    } else {
      return GraphQLResult.wrap<DocumentHistoryPayload>(Error("Unknown Error"));
    }
  }
};

import pkg from "@apollo/client";
const { gql } = pkg;
import client from "../../client.js";
import { DocumentPayload } from "../../types/document.js";
import { GraphQLResult } from "../../../utils/result.js";

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
): Promise<GraphQLResult<DocumentPayload>> => {
  try {
    const {
      data: { documentFind },
      error,
    } = await client.query({
      query: FIND_DOCUMENT,
      variables: {
        databaseName,
        collectionName,
        documentQuery,
      },
    });

    if (error) {
      return GraphQLResult.wrap<DocumentPayload>(error);
    }
    const payload: DocumentPayload = {
      docId: documentFind.docId,
      fields: documentFind.fields,
      createdAt: documentFind.fields,
    };

    return GraphQLResult.wrap(payload);
  } catch (error) {
    if (error instanceof Error) {
      return GraphQLResult.wrap<DocumentPayload>(error);
    } else {
      return GraphQLResult.wrap<DocumentPayload>(Error("Unknown Error"));
    }
  }
};

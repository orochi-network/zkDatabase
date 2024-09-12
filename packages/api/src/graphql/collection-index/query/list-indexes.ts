import pkg from "@apollo/client";
const { gql } = pkg;
import client from "../../client.js";
import { GraphQLResult } from "../../../utils/result.js";

export const LIST_INDEXES = gql`
  query IndexList($databaseName: String!, $collectionName: String!) {
    indexList(databaseName: $databaseName, collectionName: $collectionName)
  }
`;

export interface ListIndexesResponse {
  indexes: string[];
}

export const listIndexes = async (
  databaseName: string,
  collectionName: string
): Promise<GraphQLResult<string>> => {
  try {
    const {
      data: { indexList },
      error,
    } = await client.query({
      query: LIST_INDEXES,
      variables: { databaseName, collectionName },
    });

    if (error) {
      return GraphQLResult.wrap<string>(error);
    }

    if (Array.isArray(indexList)) {
      return GraphQLResult.wrap(indexList as string[]);
    }

    return GraphQLResult.wrap<string>(
      new Error("Unexpected response format or type")
    );
  } catch (error) {
    if (error instanceof Error) {
      return GraphQLResult.wrap<string>(error);
    } else {
      return GraphQLResult.wrap<string>(Error("Unknown Error"));
    }
  }
};

import pkg from "@apollo/client";
const { gql } = pkg;
import client from "../../client.js";
import { GraphQLResult } from "utils/result.js";

const LIST_COLLECTION = gql`
  query CollectionList($databaseName: String!) {
    collectionList(databaseName: $databaseName)
  }
`;

interface ListCollectionResponse {
  collections: string[];
}

export const listCollections = async (
  databaseName: string
): Promise<GraphQLResult<string>> => {
  try {
    const {
      data: { collectionList },
      error
    } = await client.query<{
      collectionList: ListCollectionResponse;
    }>({
      query: LIST_COLLECTION,
      variables: { databaseName },
    });

    if (error) {
      return GraphQLResult.wrap<string>(error);
    }
    
    if (Array.isArray(collectionList)) {
      return GraphQLResult.wrap(collectionList as string[]);
    }

    return GraphQLResult.wrap<string>(new Error('Unexpected response format or type'));
     
  } catch (error) {
    if (error instanceof Error) {
      return GraphQLResult.wrap<string>(error);
    } else {
      return GraphQLResult.wrap<string>(Error('Unknown Error'))
    }
  }
};

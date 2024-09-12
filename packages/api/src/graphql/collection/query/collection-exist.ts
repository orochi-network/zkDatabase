import pkg from "@apollo/client";
const { gql } = pkg;
import client from "../../client.js";
import { GraphQLResult } from "../../../utils/result.js";

const COLLECTION_EXIST = gql`
  query CollectionExist($databaseName: String!, $collectionName: String!) {
    collectionExist(
      databaseName: $databaseName
      collectionName: $collectionName
    )
  }
`;

export const collectionExist = async (
  databaseName: string,
  collectionName: string
): Promise<GraphQLResult<boolean>> => {
  try {
    const {
      data: { collectionExist },
      error,
    } = await client.query({
      query: COLLECTION_EXIST,
      variables: { databaseName, collectionName },
    });

    if (error) {
      return GraphQLResult.wrap<boolean>(error);
    }
    
    if (typeof collectionExist === 'boolean') {
      return GraphQLResult.wrap(collectionExist as boolean);
    }

    return GraphQLResult.wrap<boolean>(new Error('Unexpected response format or type'));
    
  } catch (error) {
    if (error instanceof Error) {
      return GraphQLResult.wrap<boolean>(error);
    } else {
      return GraphQLResult.wrap<boolean>(Error('Unknown Error'))
    }
  }
};

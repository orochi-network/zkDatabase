import { gql } from "@apollo/client";
import client from "../../client";
import { NetworkResult, handleRequest } from "../../../utils/network";

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
): Promise<NetworkResult<string[]>> => {
  return handleRequest(async () => {
    const { data } = await client.mutate<{
      collectionList: ListCollectionResponse;
    }>({
      mutation: LIST_COLLECTION,
      variables: { databaseName },
    });

    const response = data?.collectionList;

    if (response) {
      return {
        type: "success",
        data: response.collections,
      };
    } else {
      return {
        type: "error",
        message: "An unknown error occurred",
      };
    }
  });
};

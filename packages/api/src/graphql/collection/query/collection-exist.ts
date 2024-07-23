import { gql } from "@apollo/client";
import client from "../../client.js";
import { NetworkResult, handleRequest } from "../../../utils/network.js";

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
): Promise<NetworkResult<boolean>> => {
  return handleRequest(async () => {
    const { data } = await client.query({
      query: COLLECTION_EXIST,
      variables: { databaseName, collectionName },
    });

    const response = data?.collectionExist;

    if (response) {
      return {
        type: "success",
        data: response as any,
      };
    } else {
      return {
        type: "error",
        message: "An unknown error occurred",
      };
    }
  });
};

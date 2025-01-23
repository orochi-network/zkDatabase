import { gql } from "@apollo/client";
import {
  TIndexCreateRequest,
  TIndexCreateResponse,
  TIndexDropRequest,
  TIndexDropResponse,
  TIndexListRequest,
  TIndexListResponse,
} from "@zkdb/common";
import { createApi, TApolloClient } from "./common";

export const API_COLLECTION_INDEX = <T>(client: TApolloClient<T>) => ({
  indexCreate: createApi<TIndexCreateRequest, TIndexCreateResponse>(
    client,
    gql`
      mutation indexCreate(
        $databaseName: String!
        $collectionName: String!
        $index: JSON!
      ) {
        indexCreate(
          databaseName: $databaseName
          collectionName: $collectionName
          index: $index
        )
      }
    `
  ),
  indexDrop: createApi<TIndexDropRequest, TIndexDropResponse>(
    client,
    gql`
      mutation indexDrop(
        $databaseName: String!
        $collectionName: String!
        $indexName: String!
      ) {
        indexDrop(
          databaseName: $databaseName
          collectionName: $collectionName
          indexName: $indexName
        )
      }
    `
  ),
  indexList: createApi<TIndexListRequest, TIndexListResponse>(
    client,
    gql`
      query indexList($databaseName: String!, $collectionName: String!) {
        indexList(
          databaseName: $databaseName
          collectionName: $collectionName
        ) {
          indexName
          size
          access
          property
          createdAt
        }
      }
    `
  ),
});

export default API_COLLECTION_INDEX;

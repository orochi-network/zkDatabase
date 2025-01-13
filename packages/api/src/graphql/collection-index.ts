import { gql } from "@apollo/client";
import {
  TIndexCreateRequest,
  TIndexCreateResponse,
  TIndexDropResponse,
  TIndexDropRequest,
  TIndexListRequest,
  TIndexListResponse,
} from "@zkdb/common";
import {
  createMutateFunction,
  createQueryFunction,
  TApolloClient,
} from "./common";

export const API_COLLECTION_INDEX = <T>(client: TApolloClient<T>) => ({
  indexCreate: createMutateFunction<TIndexCreateRequest, TIndexCreateResponse>(
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
    `,
    (data) => data.indexCreate
  ),
  indexDrop: createMutateFunction<TIndexDropRequest, TIndexDropResponse>(
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
    `,
    (data) => data.indexDrop
  ),
  indexList: createQueryFunction<TIndexListRequest, TIndexListResponse>(
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
    `,
    (data) => data.indexList
  ),
});

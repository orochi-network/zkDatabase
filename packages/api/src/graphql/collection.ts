import { gql } from "@apollo/client";
import {
  TCollectionCreateRequest,
  TCollectionCreateResponse,
  TCollectionExistRequest,
  TCollectionExistResponse,
  TCollectionListRequest,
  TCollectionListResponse,
  TCollectionMetadataRequest,
  TCollectionMetadataResponse,
} from "@zkdb/common";
import { createApi, TApolloClient } from "./common";

export const API_COLLECTION = <T>(client: TApolloClient<T>) => ({
  collectionCreate: createApi<
    TCollectionCreateRequest,
    TCollectionCreateResponse
  >(
    client,
    gql`
      mutation collectionCreate(
        $databaseName: String!
        $collectionName: String!
        $schema: [SchemaFieldInput!]!
        $groupName: String
        $permission: Int
      ) {
        collectionCreate(
          databaseName: $databaseName
          collectionName: $collectionName
          schema: $schema
          groupName: $groupName
          permission: $permission
        )
      }
    `
  ),
  collectionExist: createApi<TCollectionExistRequest, TCollectionExistResponse>(
    client,
    gql`
      query collectionExist($databaseName: String!, $collectionName: String!) {
        collectionExist(
          databaseName: $databaseName
          collectionName: $collectionName
        )
      }
    `
  ),
  collectionList: createApi<TCollectionListRequest, TCollectionListResponse>(
    client,
    gql`
      query collectionList($databaseName: String!) {
        collectionList(databaseName: $databaseName) {
          collectionName
          schema {
            name
            kind
          }
          owner
          group
          permission
          sizeOnDisk
          createdAt
          updatedAt
        }
      }
    `
  ),
  collectionMetadata: createApi<
    TCollectionMetadataRequest,
    TCollectionMetadataResponse
  >(
    client,
    gql`
      query collectionMetadata(
        $databaseName: String!
        $collectionName: String!
      ) {
        collectionMetadata(
          databaseName: $databaseName
          collectionName: $collectionName
        ) {
          collectionName
          schema {
            name
            kind
          }
          owner
          group
          permission
          sizeOnDisk
          createdAt
          updatedAt
        }
      }
    `
  ),
});

export default API_COLLECTION;

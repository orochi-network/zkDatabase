import { gql } from "@apollo/client";
import {
  TCollection,
  TCollectionCreateRequest,
  TCollectionListRequest,
  TCollectionListResponse,
  TCollectionRequest,
} from "@zkdb/common";
import {
  createMutateFunction,
  createQueryFunction,
  TApolloClient,
} from "./common";

const COLLECTION_CREATE = gql`
  mutation CollectionCreate(
    $databaseName: String!
    $collectionName: String!
    $schema: [SchemaFieldInput!]!
    $groupName: String
    $index: [IndexInput]
    $permission: Number
  ) {
    collectionCreate(
      databaseName: $databaseName
      collectionName: $collectionName
      groupName: $groupName
      schema: $schema
      index: $index
      permission: $permission
    )
  }
`;

const COLLECTION_EXIST = gql`
  query CollectionExist($databaseName: String!, $collectionName: String!) {
    collectionExist(
      databaseName: $databaseName
      collectionName: $collectionName
    )
  }
`;

const COLLECTION_LIST = gql`
  query CollectionList($databaseName: String!) {
    collectionList(databaseName: $databaseName) {
      name
      index
      schema {
        order
        name
        kind
        indexed
      }
      ownership {
        userName
        groupName
        permission
      }
    }
  }
`;

export const collection = <T>(client: TApolloClient<T>) => ({
  create: createMutateFunction<
    boolean,
    TCollectionCreateRequest,
    { collectionCreate: boolean }
  >(client, COLLECTION_CREATE, (data) => data.collectionCreate),
  exist: createQueryFunction<
    boolean,
    TCollectionRequest,
    { collectionExist: boolean }
  >(client, COLLECTION_EXIST, (data) => data.collectionExist),
  list: createQueryFunction<
    TCollection[],
    TCollectionListRequest,
    { collectionList: TCollectionListResponse }
  >(client, COLLECTION_LIST, (data) => data.collectionList),
});

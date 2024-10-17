import { gql } from "@apollo/client";
import {
  createMutateFunction,
  createQueryFunction,
  TApolloClient,
} from "./common";
import { TCollectionIndex } from "./types/collection-index";

const COLLECTION_INDEX_CREATE = gql`
  mutation IndexCreate(
    $databaseName: String!
    $collectionName: String!
    $indexes: [IndexInput!]!
  ) {
    indexCreate(
      databaseName: $databaseName
      collectionName: $collectionName
      indexes: $indexes
    )
  }
`;

const COLLECTION_INDEX_DELETE = gql`
  mutation IndexDrop(
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
`;

const COLLECTION_INDEX_EXIST = gql`
  query IndexExist(
    $databaseName: String!
    $collectionName: String!
    $indexName: String!
  ) {
    indexExist(
      databaseName: $databaseName
      collectionName: $collectionName
      indexName: $indexName
    )
  }
`;

const COLLECTION_INDEX_LIST = gql`
  query IndexList($databaseName: String!, $collectionName: String!) {
    indexList(databaseName: $databaseName, collectionName: $collectionName)
  }
`;

export const collectionIndex = <T>(client: TApolloClient<T>) => ({
  create: createMutateFunction<
    boolean,
    { databaseName: string; collectionName: string; indexes: TCollectionIndex[] },
    { indexCreate: boolean }
  >(client, COLLECTION_INDEX_CREATE, (data) => data.indexCreate),
  delete: createMutateFunction<
    boolean,
    { databaseName: string; collectionName: string; indexName: string },
    { indexDrop: boolean }
  >(client, COLLECTION_INDEX_DELETE, (data) => data.indexDrop),
  exist: createQueryFunction<
    boolean,
    { databaseName: string; collectionName: string; indexName: string },
    { indexExist: boolean }
  >(client, COLLECTION_INDEX_EXIST, (data) => data.indexExist),
  list: createQueryFunction<
    string[],
    { databaseName: string; collectionName: string },
    { indexList: string[] }
  >(client, COLLECTION_INDEX_LIST, (data) => data.indexList),
});

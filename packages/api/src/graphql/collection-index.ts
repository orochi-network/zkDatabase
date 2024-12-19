import { gql } from "@apollo/client";
import {
  TIndexCreateRequest,
  TIndexDropRequest,
  TIndexExistRequest,
  TIndexListRequest,
  TIndexListResponse,
} from "@zkdb/common";
import {
  createMutateFunction,
  createQueryFunction,
  TApolloClient,
} from "./common";

const COLLECTION_INDEX_CREATE = gql`
  mutation IndexCreate(
    $databaseName: String!
    $collectionName: String!
    $index: [IndexInput!]!
  ) {
    indexCreate(
      databaseName: $databaseName
      collectionName: $collectionName
      index: $index
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
    TIndexCreateRequest,
    { indexCreate: boolean }
  >(client, COLLECTION_INDEX_CREATE, (data) => data.indexCreate),
  drop: createMutateFunction<
    boolean,
    TIndexDropRequest,
    { indexDrop: boolean }
  >(client, COLLECTION_INDEX_DELETE, (data) => data.indexDrop),
  exist: createQueryFunction<
    boolean,
    TIndexExistRequest,
    { indexExist: boolean }
  >(client, COLLECTION_INDEX_EXIST, (data) => data.indexExist),
  list: createQueryFunction<
    string[],
    TIndexListRequest,
    { indexList: TIndexListResponse }
  >(client, COLLECTION_INDEX_LIST, (data) => data.indexList),
});

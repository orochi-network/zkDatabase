import { gql } from "@apollo/client";
import {
  createMutateFunction,
  createQueryFunction,
  TApolloClient,
} from "./common";
import { TNetworkId } from "./types/network";

const COLLECTION_INDEX_CREATE = gql`
  mutation IndexCreate(
    $networkId: NetworkId!
    $databaseName: String!
    $collectionName: String!
    $indexes: [String]!
  ) {
    indexCreate(
      networkId: $networkId
      databaseName: $databaseName
      collectionName: $collectionName
      indexes: $indexes
    )
  }
`;

const COLLECTION_INDEX_DELETE = gql`
  mutation IndexDrop(
    $networkId: NetworkId!
    $databaseName: String!
    $collectionName: String!
    $indexName: String!
  ) {
    indexDrop(
      networkId: $networkId
      databaseName: $databaseName
      collectionName: $collectionName
      indexName: $indexName
    )
  }
`;

const COLLECTION_INDEX_EXIST = gql`
  query IndexExist(
    $networkId: NetworkId!
    $databaseName: String!
    $collectionName: String!
    $indexName: String!
  ) {
    indexExist(
      networkId: $networkId
      databaseName: $databaseName
      collectionName: $collectionName
      indexName: $indexName
    )
  }
`;

const COLLECTION_INDEX_LIST = gql`
  query IndexList(
    $networkId: NetworkId!
    $databaseName: String!
    $collectionName: String!
  ) {
    indexList(
      networkId: $networkId
      databaseName: $databaseName
      collectionName: $collectionName
    )
  }
`;

export const collectionIndex = <T>(client: TApolloClient<T>) => ({
  create: createMutateFunction<
    boolean,
    {
      networkId: TNetworkId;
      databaseName: string;
      collectionName: string;
      indexes: string[];
    },
    { indexCreate: boolean }
  >(client, COLLECTION_INDEX_CREATE, (data) => data.indexCreate),
  delete: createMutateFunction<
    boolean,
    {
      networkId: TNetworkId;
      databaseName: string;
      collectionName: string;
      indexName: string;
    },
    { indexDrop: boolean }
  >(client, COLLECTION_INDEX_DELETE, (data) => data.indexDrop),
  exist: createQueryFunction<
    boolean,
    {
      networkId: TNetworkId;
      databaseName: string;
      collectionName: string;
      indexName: string;
    },
    { indexExist: boolean }
  >(client, COLLECTION_INDEX_EXIST, (data) => data.indexExist),
  list: createQueryFunction<
    string[],
    { networkId: TNetworkId; databaseName: string; collectionName: string },
    { indexList: string[] }
  >(client, COLLECTION_INDEX_LIST, (data) => data.indexList),
});

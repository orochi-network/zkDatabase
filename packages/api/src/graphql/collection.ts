import { gql } from "@apollo/client";
import {
  createMutateFunction,
  createQueryFunction,
  TApolloClient,
} from "./common";
import { TSchema } from "./types";
import { TCollection } from "./types/collection";
import { TCollectionIndex } from "./types/collection-index";

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

export type TCollectionListRequest = {
  databaseName: string;
};

export type TCollectionListResponse = { collectionList: TCollection[] };

export type TCollectionExistRequest = TCollectionListRequest & {
  collectionName: string;
};

export type TCollectionExistResponse = { collectionExist: boolean };

export type TCollectionCreateRequest = TCollectionExistRequest & {
  schema: TSchema;
  groupName?: string;
  index?: TCollectionIndex[];
  permission?: number;
};

export type TCollectionCreateResponse = { collectionCreate: boolean };

export const collection = <T>(client: TApolloClient<T>) => ({
  create: createMutateFunction<
    boolean,
    TCollectionCreateRequest,
    TCollectionCreateResponse
  >(client, COLLECTION_CREATE, (data) => data.collectionCreate),
  exist: createQueryFunction<
    boolean,
    TCollectionExistRequest,
    TCollectionExistResponse
  >(client, COLLECTION_EXIST, (data) => data.collectionExist),
  list: createQueryFunction<
    TCollection[],
    TCollectionListRequest,
    TCollectionListResponse
  >(client, COLLECTION_LIST, (data) => data.collectionList),
});

import * as pkg from "@apollo/client";
import {
  createMutateFunction,
  createQueryFunction,
  TApolloClient,
} from "./common.js";
import { TPermissions } from "./types/ownership.js";
import { TSchema } from "./types/schema.js";

const { gql } = pkg;

const COLLECTION_CREATE = gql`
  mutation CollectionCreate(
    $databaseName: String!
    $collectionName: String!
    $groupName: String!
    $schema: [SchemaFieldInput!]!
    $permissions: PermissionDetailInput
  ) {
    collectionCreate(
      databaseName: $databaseName
      collectionName: $collectionName
      groupName: $groupName
      schema: $schema
      permissions: $permissions
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
    collectionList(databaseName: $databaseName)
  }
`;

export type TCollectionListRequest = {
  databaseName: string;
};

export type TCollectionListResponse = {
  collections: string[];
};

export type TCollectionExistRequest = TCollectionListRequest & {
  collectionName: string;
};

export type TCollectionExistResponse = { collectionExist: boolean };

export type TCollectionCreateRequest = TCollectionExistRequest & {
  groupName: string;
  schema: TSchema;
  permissions: TPermissions;
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
    string[],
    TCollectionListRequest,
    TCollectionListResponse
  >(client, COLLECTION_LIST, (data) => data.collections),
});

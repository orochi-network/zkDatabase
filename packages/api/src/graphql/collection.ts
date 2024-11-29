import { gql } from "@apollo/client";
import {
  createMutateFunction,
  createQueryFunction,
  TApolloClient,
} from "./common";
import { TPermissions, TSchema } from "./types";
import { Collection } from "./types/collection";
import { TCollectionIndex } from "./types/collection-index";

const COLLECTION_CREATE = gql`
  mutation CollectionCreate(
    $databaseName: String!
    $collectionName: String!
    $groupName: String!
    $schema: [SchemaFieldInput!]!
    $indexes: [IndexInput]
    $permission: Number
  ) {
    collectionCreate(
      databaseName: $databaseName
      collectionName: $collectionName
      groupName: $groupName
      schema: $schema
      indexes: $indexes
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
    collectionList(databaseName: $databaseName) {
      name
      indexes
      schema {
        order
        name
        kind
        indexed
      }
      ownership {
        userName
        groupName
        permissionOwner {
          read
          write
          delete
          create
          system
        }
        permissionGroup {
          read
          write
          delete
          create
          system
        }
        permissionOther {
          read
          write
          delete
          create
          system
        }
      }
    }
  }
`;

export type TCollectionListRequest = {
  databaseName: string;
};

export type TCollectionListResponse = { collectionList: Collection[] };

export type TCollectionExistRequest = TCollectionListRequest & {
  collectionName: string;
};

export type TCollectionExistResponse = { collectionExist: boolean };

export type TCollectionCreateRequest = TCollectionExistRequest & {
  groupName: string;
  schema: TSchema;
  indexes: TCollectionIndex[];
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
    Collection[],
    TCollectionListRequest,
    TCollectionListResponse
  >(client, COLLECTION_LIST, (data) => data.collectionList),
});

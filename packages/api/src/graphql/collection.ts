import { gql } from "@apollo/client";
import {
  createMutateFunction,
  createQueryFunction,
  TApolloClient,
} from "./common";
import { TPermissions, TSchema } from "./types";
import { Collection } from "./types/collection";
import { TNetworkId } from "./types/network";

const COLLECTION_CREATE = gql`
  mutation CollectionCreate(
    $networkId: NetworkId!
    $databaseName: String!
    $collectionName: String!
    $groupName: String!
    $schema: [SchemaFieldInput!]!
    $indexes: [String]
    $permissions: PermissionDetailInput
  ) {
    collectionCreate(
      networkId: $networkId
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
  query CollectionExist(
    $networkId: NetworkId!
    $databaseName: String!
    $collectionName: String!
  ) {
    collectionExist(
      networkId: $networkId
      databaseName: $databaseName
      collectionName: $collectionName
    )
  }
`;

const COLLECTION_LIST = gql`
  query CollectionList($networkId: NetworkId!, $databaseName: String!) {
    collectionList(networkId: $networkId, databaseName: $databaseName) {
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
  networkId: TNetworkId;
};

export type TCollectionListResponse = { collectionList: Collection[] };

export type TCollectionExistRequest = TCollectionListRequest & {
  collectionName: string;
  networkId: TNetworkId;
};

export type TCollectionExistResponse = { collectionExist: boolean };

export type TCollectionCreateRequest = TCollectionExistRequest & {
  groupName: string;
  schema: TSchema;
  indexes: string[];
  permissions: TPermissions;
  networkId: TNetworkId;
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

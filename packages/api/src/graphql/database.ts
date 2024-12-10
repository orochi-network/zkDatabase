import { gql } from "@apollo/client";
import {
  TDatabaseChangeOwnerRequest,
  TDatabaseCreateRequest,
  TDatabaseListRequest,
  TDatabaseListResponse,
  TDatabaseRequest,
  TMetadataDatabase,
} from "@zkdb/common";
import {
  createMutateFunction,
  createQueryFunction,
  TApolloClient,
} from "./common.js";

const DATABASE_CHANGE_OWNER = gql`
  mutation DbChangeOwner($databaseName: String!, $newOwner: String!) {
    dbChangeOwner(databaseName: $databaseName, newOwner: $newOwner)
  }
`;

const DATABASE_CREATE = gql`
  mutation DbCreate($databaseName: String!, $merkleHeight: Int!) {
    dbCreate(databaseName: $databaseName, merkleHeight: $merkleHeight)
  }
`;

const DATABASE_SETTING = gql`
  query GetDbSetting($databaseName: String!) {
    dbSetting(databaseName: $databaseName) {
      merkleHeight
      publicKey
      databaseOwner
    }
  }
`;

const DATABASE_STATUS = gql`
  query GetDbStats($databaseName: String!) {
    dbStats(databaseName: $databaseName)
  }
`;

const DATABASE_LIST = gql`
  query GetDbList($query: JSON, $pagination: PaginationInput) {
    dbList(query: $query, pagination: $pagination) {
      totalSize
      offset
      data {
        databaseName
        databaseOwner
        databaseSize
        merkleHeight
        appPublicKey
        collection {
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
    }
  }
`;

const DATABASE_EXIST = gql`
  query GetDbExisted($databaseName: String!) {
    dbExist(databaseName: $databaseName)
  }
`;
export const database = <T>(client: TApolloClient<T>) => ({
  transferOwnership: createMutateFunction<
    boolean,
    TDatabaseChangeOwnerRequest,
    { dbChangeOwner: boolean }
  >(client, DATABASE_CHANGE_OWNER, (data) => data.dbChangeOwner),
  create: createMutateFunction<
    boolean,
    TDatabaseCreateRequest,
    { dbCreate: boolean }
  >(client, DATABASE_CREATE, (data) => data.dbCreate),
  metadata: createQueryFunction<
    TMetadataDatabase,
    TDatabaseRequest,
    { metadata: TMetadataDatabase }
  >(client, DATABASE_SETTING, (data) => data.metadata),
  status: createQueryFunction<JSON, TDatabaseRequest, { dbStats: JSON }>(
    client,
    DATABASE_STATUS,
    (data) => data.dbStats
  ),
  list: createQueryFunction<
    TDatabaseListResponse,
    TDatabaseListRequest,
    { dbList: TDatabaseListResponse }
  >(client, DATABASE_LIST, (data) => data.dbList.data),
  exist: createQueryFunction<boolean, TDatabaseRequest, { dbExist: boolean }>(
    client,
    DATABASE_EXIST,
    (data) => data.dbExist
  ),
});

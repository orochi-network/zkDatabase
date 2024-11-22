import { gql } from "@apollo/client";
import {
  createMutateFunction,
  createQueryFunction,
  TApolloClient,
} from "./common.js";
import {
  TDatabase,
  TDatabaseSettings,
  TDatabaseStatus,
  TPagination,
  TPaginationResponse,
} from "./types";

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
  query GetDbSettings($databaseName: String!) {
    dbSetting(databaseName: $databaseName) {
      merkleHeight
      publicKey
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
        collections {
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
    }
  }
`;

export const database = <T>(client: TApolloClient<T>) => ({
  transferOwnership: createMutateFunction<
    boolean,
    { databaseName: string; newOwner: string },
    { dbChangeOwner: boolean }
  >(client, DATABASE_CHANGE_OWNER, (data) => data.dbChangeOwner),
  create: createMutateFunction<
    boolean,
    { databaseName: string; merkleHeight: number },
    { dbCreate: boolean }
  >(client, DATABASE_CREATE, (data) => data.dbCreate),
  setting: createQueryFunction<
    TDatabaseSettings,
    { databaseName: string },
    { dbSetting: TDatabaseSettings }
  >(client, DATABASE_SETTING, (data) => data.dbSetting),
  status: createQueryFunction<
    TDatabaseStatus,
    { databaseName: string },
    { dbStats: TDatabaseStatus }
  >(client, DATABASE_STATUS, (data) => data.dbStats),
  list: createQueryFunction<
    TDatabase[],
    { query: any; pagination: TPagination },
    { dbList: TPaginationResponse<TDatabase[]> }
  >(client, DATABASE_LIST, (data) => data.dbList.data),
});

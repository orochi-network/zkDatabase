import * as pkg from "@apollo/client";
import {
  createMutateFunction,
  createQueryFunction,
  TApolloClient,
} from "./common.js";
import {
  TDatabase,
  TDatabaseSettings,
  TDatabaseStatus,
} from "./types/database.js";
import { TPagination } from "./types/pagination.js";

const { gql } = pkg;

const DATABASE_CHANGE_OWNER = gql`
  mutation DbChangeOwner($databaseName: String!, $newOwner: String!) {
    dbChangeOwner(databaseName: $databaseName, newOwner: $newOwner)
  }
`;

const DATABASE_CREATE = gql`
  mutation DbCreate(
    $databaseName: String!
    $merkleHeight: Int!
    $publicKey: String!
  ) {
    dbCreate(
      databaseName: $databaseName
      merkleHeight: $merkleHeight
      publicKey: $publicKey
    )
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
  query GetDbList($search: SearchInput, $pagination: PaginationInput) {
    dbList(search: $search, pagination: $pagination) {
      databaseName
      databaseSize
      merkleHeight
      collections
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
    { databaseName: string; merkleHeight: number; publicKey: string },
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
    { dbList: TDatabase[] }
  >(client, DATABASE_LIST, (data) => data.dbList),
});

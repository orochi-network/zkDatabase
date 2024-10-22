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
import { TNetworkId } from "./types/network.js";

const DATABASE_CHANGE_OWNER = gql`
  mutation DbChangeOwner(
    $networkId: NetworkId!
    $databaseName: String!
    $newOwner: String!
  ) {
    dbChangeOwner(
      networkId: $networkId
      databaseName: $databaseName
      newOwner: $newOwner
    )
  }
`;

const DATABASE_CREATE = gql`
  mutation DbCreate(
    $networkId: NetworkId!
    $databaseName: String!
    $merkleHeight: Int!
    $publicKey: String!
  ) {
    dbCreate(
      networkId: $networkId
      databaseName: $databaseName
      merkleHeight: $merkleHeight
      publicKey: $publicKey
    )
  }
`;

const DATABASE_SETTING = gql`
  query GetDbSettings($networkId: NetworkId!, $databaseName: String!) {
    dbSetting(networkId: $networkId, databaseName: $databaseName) {
      merkleHeight
      publicKey
    }
  }
`;

const DATABASE_STATUS = gql`
  query GetDbStats($networkId: NetworkId!, $databaseName: String!) {
    dbStats(networkId: $networkId, databaseName: $databaseName)
  }
`;

const DATABASE_LIST = gql`
  query GetDbList($networkId: NetworkId!, $query: JSON, $pagination: PaginationInput) {
    dbList(networkId: $networkId, query: $query, pagination: $pagination) {
      totalSize
      offset
      data {
        databaseName
        databaseOwner
        databaseSize
        merkleHeight
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
    { networkId: TNetworkId; databaseName: string; newOwner: string },
    { dbChangeOwner: boolean }
  >(client, DATABASE_CHANGE_OWNER, (data) => data.dbChangeOwner),
  create: createMutateFunction<
    boolean,
    {
      networkId: TNetworkId;
      databaseName: string;
      merkleHeight: number;
      publicKey: string;
    },
    { dbCreate: boolean }
  >(client, DATABASE_CREATE, (data) => data.dbCreate),
  setting: createQueryFunction<
    TDatabaseSettings,
    { networkId: TNetworkId; databaseName: string },
    { dbSetting: TDatabaseSettings }
  >(client, DATABASE_SETTING, (data) => data.dbSetting),
  status: createQueryFunction<
    TDatabaseStatus,
    { networkId: TNetworkId; databaseName: string },
    { dbStats: TDatabaseStatus }
  >(client, DATABASE_STATUS, (data) => data.dbStats),
  list: createQueryFunction<
    TDatabase[],
    { networkId: TNetworkId; query: any; pagination: TPagination },
    { dbList: TPaginationResponse<TDatabase[]> }
  >(client, DATABASE_LIST, (data) => data.dbList.data),
});

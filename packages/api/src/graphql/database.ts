import { gql } from "@apollo/client";
import {
  TDatabaseChangeOwnerRequest,
  TDatabaseChangeOwnerResponse,
  TDatabaseDeployRequest,
  TDatabaseDeployResponse,
  TDatabaseEnvironmentRequest,
  TDatabaseEnvironmentResponse,
  TDatabaseExistRequest,
  TDatabaseExistResponse,
  TDatabaseInfoRequest,
  TDatabaseInfoResponse,
  TDatabaseListRequest,
  TDatabaseListResponse,
  TDatabaseRequest,
  TDatabaseStatsRequest,
  TDatabaseStatsResponse,
} from "@zkdb/common";
import {
  createMutateFunction,
  createQueryFunction,
  TApolloClient,
} from "./common.js";

export const database = <T>(client: TApolloClient<T>) => ({
  dbTransferOwner: createMutateFunction<
    TDatabaseChangeOwnerRequest,
    TDatabaseChangeOwnerResponse
  >(
    client,
    gql`
      mutation dbTransferOwner($databaseName: String!, $newOwner: String!) {
        dbTransferOwner(databaseName: $databaseName, newOwner: $newOwner)
      }
    `,
    (data) => data.dbTransferOwner
  ),
  dbCreate: createQueryFunction<TDatabaseDeployRequest, TDatabaseRequest>(
    client,
    gql`
      mutation dbCreate($databaseName: String!, $merkleHeight: Int!) {
        dbCreate(databaseName: $databaseName, merkleHeight: $merkleHeight)
      }
    `,
    (data) => data.dbCreate
  ),
  dbDeploy: createQueryFunction<
    TDatabaseDeployRequest,
    TDatabaseDeployResponse
  >(
    client,
    gql`
      mutation dbDeploy($databaseName: String!, $appPublicKey: String!) {
        dbDeploy(databaseName: $databaseName, appPublicKey: $appPublicKey)
      }
    `,
    (data) => data.dbDeploy
  ),
  dbEnvironment: createQueryFunction<
    TDatabaseEnvironmentRequest,
    TDatabaseEnvironmentResponse
  >(
    client,
    gql`
      query dbEnvironment {
        dbEnvironment {
          networkId
          networkUrl
        }
      }
    `,
    (data) => data.dbList.dbEnvironment
  ),
  dbExist: createQueryFunction<TDatabaseExistRequest, TDatabaseExistResponse>(
    client,
    gql`
      query dbExist($databaseName: String!) {
        dbExist(databaseName: $databaseName)
      }
    `,
    (data) => data.dbList.dbExist
  ),
  dbInfo: createQueryFunction<TDatabaseInfoRequest, TDatabaseInfoResponse>(
    client,
    gql`
      query dbInfo($databaseName: String!) {
        dbInfo(databaseName: $databaseName) {
          databaseName
          databaseOwner
          merkleHeight
          appPublicKey
          sizeOnDisk
          deployStatus
        }
      }
    `,
    (data) => data.dbInfo
  ),
  dbList: createQueryFunction<TDatabaseListRequest, TDatabaseListResponse>(
    client,
    gql`
      query dbList($query: JSON, $pagination: PaginationInput) {
        dbList(query: $query, pagination: $pagination) {
          data {
            ...MetadataDatabaseFragment
          }
          total
          offset
        }
      }
    `,
    (data) => data.dbList
  ),
  dbStats: createQueryFunction<TDatabaseStatsRequest, TDatabaseStatsResponse>(
    client,
    gql`
      query dbStats($databaseName: String!) {
        dbStats(databaseName: $databaseName)
      }
    `,
    (data) => data.dbStats
  ),
});

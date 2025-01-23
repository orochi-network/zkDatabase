import { gql } from "@apollo/client";
import {
  TDatabaseCreateRequest,
  TDatabaseCreateResponse,
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
  TDatabaseStatsRequest,
  TDatabaseStatsResponse,
  TVerificationKeyRequest,
  TVerificationKeyResponse,
} from "@zkdb/common";
import { createApi, TApolloClient } from "./common.js";

export const API_DATABASE = <T>(client: TApolloClient<T>) => ({
  dbCreate: createApi<TDatabaseCreateRequest, TDatabaseCreateResponse>(
    client,
    gql`
      mutation dbCreate($databaseName: String!, $merkleHeight: Int!) {
        dbCreate(databaseName: $databaseName, merkleHeight: $merkleHeight)
      }
    `
  ),
  dbDeploy: createApi<TDatabaseDeployRequest, TDatabaseDeployResponse>(
    client,
    gql`
      mutation dbDeploy($databaseName: String!, $appPublicKey: String!) {
        dbDeploy(databaseName: $databaseName, appPublicKey: $appPublicKey)
      }
    `
  ),
  dbEnvironment: createApi<
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
    `
  ),
  dbExist: createApi<TDatabaseExistRequest, TDatabaseExistResponse>(
    client,
    gql`
      query dbExist($databaseName: String!) {
        dbExist(databaseName: $databaseName)
      }
    `
  ),
  dbInfo: createApi<TDatabaseInfoRequest, TDatabaseInfoResponse>(
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
    `
  ),
  dbList: createApi<TDatabaseListRequest, TDatabaseListResponse>(
    client,
    gql`
      query dbList($query: JSON, $pagination: PaginationInput) {
        dbList(query: $query, pagination: $pagination) {
          data {
            databaseName
            databaseOwner
            merkleHeight
            appPublicKey
            sizeOnDisk
            deployStatus
          }
          total
          offset
        }
      }
    `
  ),
  dbStats: createApi<TDatabaseStatsRequest, TDatabaseStatsResponse>(
    client,
    gql`
      query dbStats($databaseName: String!) {
        dbStats(databaseName: $databaseName)
      }
    `
  ),
  dbVerificationKey: createApi<
    TVerificationKeyRequest,
    TVerificationKeyResponse
  >(
    client,
    gql`
      query dbVerificationKey($databaseName: String!) {
        dbVerificationKey(databaseName: $databaseName)
      }
    `
  ),
});

export default API_DATABASE;

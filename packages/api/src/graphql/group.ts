import { gql } from "@apollo/client";
import {
  TGroupAddUserListRequest,
  TGroupAddUserListResponse,
  TGroupCreateRequest,
  TGroupCreateResponse,
  TGroupDetailRequest,
  TGroupDetailResponse,
  TGroupListAllRequest,
  TGroupListAllResponse,
  TGroupListByUserRequest,
  TGroupListByUserResponse,
  TGroupRemoveUserListRequest,
  TGroupRemoveUserListResponse,
  TGroupUpdateRequest,
  TGroupUpdateResponse,
} from "@zkdb/common";
import { createApi, TApolloClient } from "./common";

export const API_GROUP = <T>(client: TApolloClient<T>) => ({
  groupAddUser: createApi<TGroupAddUserListRequest, TGroupAddUserListResponse>(
    client,
    gql`
      mutation groupAddUser(
        $databaseName: String!
        $groupName: String!
        $listUser: [String!]!
      ) {
        groupAddUser(
          databaseName: $databaseName
          groupName: $groupName
          listUser: $listUser
        )
      }
    `
  ),
  groupCreate: createApi<TGroupCreateRequest, TGroupCreateResponse>(
    client,
    gql`
      mutation groupCreate(
        $databaseName: String!
        $groupName: String!
        $groupDescription: String
      ) {
        groupCreate(
          databaseName: $databaseName
          groupName: $groupName
          groupDescription: $groupDescription
        )
      }
    `
  ),
  groupRemoveUser: createApi<
    TGroupRemoveUserListRequest,
    TGroupRemoveUserListResponse
  >(
    client,
    gql`
      mutation groupRemoveUser(
        $databaseName: String!
        $groupName: String!
        $listUser: [String!]!
      ) {
        groupRemoveUser(
          databaseName: $databaseName
          groupName: $groupName
          listUser: $listUser
        )
      }
    `
  ),
  groupUpdate: createApi<TGroupUpdateRequest, TGroupUpdateResponse>(
    client,
    gql`
      mutation groupUpdate(
        $databaseName: String!
        $groupName: String!
        $newGroupName: String
        $newGroupDescription: String
      ) {
        groupUpdate(
          databaseName: $databaseName
          groupName: $groupName
          newGroupName: $newGroupName
          newGroupDescription: $newGroupDescription
        )
      }
    `
  ),
  groupDetail: createApi<TGroupDetailRequest, TGroupDetailResponse>(
    client,
    gql`
      query groupDetail($databaseName: String!, $groupName: String!) {
        groupDetail(databaseName: $databaseName, groupName: $groupName) {
          groupName
          groupDescription
          createdBy
          updatedAt
          createdAt
          listUser {
            userName
            updatedAt
            createdAt
          }
        }
      }
    `
  ),
  groupListAll: createApi<TGroupListAllRequest, TGroupListAllResponse>(
    client,
    gql`
      query groupListAll($databaseName: String!) {
        groupListAll(databaseName: $databaseName) {
          groupName
          groupDescription
          createdBy
          updatedAt
          createdAt
        }
      }
    `
  ),
  groupListByUser: createApi<TGroupListByUserRequest, TGroupListByUserResponse>(
    client,
    gql`
      query groupListByUser(
        $databaseName: String!
        $userQuery: GroupListByUserRequest!
      ) {
        groupListByUser(databaseName: $databaseName, userQuery: $userQuery)
      }
    `
  ),
});

export default API_GROUP;

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
import {
  createMutateFunction,
  createQueryFunction,
  TApolloClient,
} from "./common";

export const API_GROUP = <T>(client: TApolloClient<T>) => ({
  groupAddUser: createMutateFunction<
    TGroupAddUserListRequest,
    TGroupAddUserListResponse
  >(
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
    `,
    (data) => data.groupAddUser
  ),
  groupCreate: createMutateFunction<TGroupCreateRequest, TGroupCreateResponse>(
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
    `,
    (data) => data.groupCreate
  ),
  groupRemoveUser: createMutateFunction<
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
    `,
    (data) => data.groupRemoveUser
  ),
  groupUpdate: createMutateFunction<TGroupUpdateRequest, TGroupUpdateResponse>(
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
    `,
    (data) => data.groupUpdate
  ),
  groupDetail: createQueryFunction<TGroupDetailRequest, TGroupDetailResponse>(
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
            ...GroupUserInfoFragment
          }
        }
      }
    `,
    (data) => data.groupDetail
  ),
  groupListAll: createQueryFunction<
    TGroupListAllRequest,
    TGroupListAllResponse
  >(
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
    `,
    (data) => data.groupListAll
  ),
  groupListByUser: createQueryFunction<
    TGroupListByUserRequest,
    TGroupListByUserResponse
  >(
    client,
    gql`
      query indexExist(
        $databaseName: String!
        $collectionName: String!
        $indexName: String!
      ) {
        indexExist(
          databaseName: $databaseName
          collectionName: $collectionName
          indexName: $indexName
        )
      }
    `,
    (data) => data.groupListByUser
  ),
});

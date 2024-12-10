import { gql } from "@apollo/client";
import {
  TGroupAddUsersRequest,
  TGroupCreateRequest,
  TGroupInfoDetailRequest,
  TGroupInfoDetailResponse,
  TGroupListAllRequest,
  TGroupListAllResponse,
  TGroupRemoveUsersRequest,
  TGroupUpdateRequest,
} from "@zkdb/common";
import {
  createMutateFunction,
  createQueryFunction,
  TApolloClient,
} from "./common";

export const group = <T>(client: TApolloClient<T>) => ({
  addUser: createMutateFunction<
    boolean,
    TGroupAddUsersRequest,
    { groupAddUsers: boolean }
  >(
    client,
    gql`
      mutation GroupAddUsers(
        $databaseName: String!
        $groupName: String!
        $userNames: [String!]!
      ) {
        groupAddUsers(
          databaseName: $databaseName
          groupName: $groupName
          userNames: $userNames
        )
      }
    `,
    (data) => data.groupAddUsers
  ),
  update: createMutateFunction<
    boolean,
    TGroupUpdateRequest,
    { groupUpdate: boolean }
  >(
    client,
    gql`
      mutation GroupChangeDescription(
        $databaseName: String!
        $groupName: String!
        $groupDescription: String!
      ) {
        groupChangeDescription(
          databaseName: $databaseName
          groupName: $groupName
          groupDescription: $groupDescription
        )
      }
    `,
    (data) => data.groupUpdate
  ),
  create: createMutateFunction<
    boolean,
    TGroupCreateRequest,
    { groupCreate: boolean }
  >(
    client,
    gql`
      mutation GroupCreate(
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
  removeUser: createMutateFunction<
    boolean,
    TGroupRemoveUsersRequest,
    { groupRemoveUsers: boolean }
  >(
    client,
    gql`
      mutation GroupRemoveUsers(
        $databaseName: String!
        $groupName: String!
        $userNames: [String!]!
      ) {
        groupRemoveUsers(
          databaseName: $databaseName
          groupName: $groupName
          userNames: $userNames
        )
      }
    `,
    (data) => data.groupRemoveUsers
  ),
  info: createQueryFunction<
    TGroupInfoDetailRequest,
    { databaseName: string; groupName: string },
    { groupInfo: TGroupInfoDetailResponse }
  >(
    client,
    gql`
      mutation GroupInfo($databaseName: String!, $groupName: String!) {
        groupInfo(databaseName: $databaseName, groupName: $groupName)
      }
    `,
    (data) => data.groupInfo
  ),
  list: createQueryFunction<
    TGroupListAllResponse,
    TGroupListAllRequest,
    { groupListAll: TGroupListAllResponse }
  >(
    client,
    gql`
      query GroupListAll($databaseName: String!) {
        groupListAll(databaseName: $databaseName)
      }
    `,
    (data) => data.groupListAll
  ),
  listUser: createQueryFunction<
    string[],
    { databaseName: string; userName: string },
    { groupListByUser: string[] }
  >(
    client,
    gql`
      query GroupListByUser($databaseName: String!, $userName: String!) {
        groupListByUser(databaseName: $databaseName, userName: $userName)
      }
    `,
    (data) => data.groupListByUser
  ),
});

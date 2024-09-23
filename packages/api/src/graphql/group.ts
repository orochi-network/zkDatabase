import pkg, { ApolloClient } from "@apollo/client";
import { createMutateFunction, createQueryFunction } from "./common.js";
import { TGroupInfo } from "./types/group.js";

const { gql } = pkg;

export const group = <T>(client: ApolloClient<T>) => ({
  addUser: createMutateFunction<
    boolean,
    { databaseName: string; groupName: string; userNames: string[] },
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
  updateDescription: createMutateFunction<
    boolean,
    { databaseName: string; groupName: string; groupDescription: string },
    { groupChangeDescription: boolean }
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
    (data) => data.groupChangeDescription
  ),
  create: createMutateFunction<
    boolean,
    { databaseName: string; groupName: string; groupDescription: string },
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
    { databaseName: string; groupName: string; userNames: string[] },
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
  rename: createMutateFunction<
    boolean,
    { databaseName: string; groupName: string; newGroupName: string },
    { groupRename: boolean }
  >(
    client,
    gql`
      mutation GroupRename(
        $databaseName: String!
        $groupName: String!
        $newGroupName: String!
      ) {
        groupRename(
          databaseName: $databaseName
          groupName: $groupName
          newGroupName: $newGroupName
        )
      }
    `,
    (data) => data.groupRename
  ),
  info: createQueryFunction<
    TGroupInfo,
    { databaseName: string; groupName: string },
    { groupInfo: TGroupInfo }
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
    TGroupInfo[],
    { databaseName: string },
    { groupListAll: TGroupInfo[] }
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

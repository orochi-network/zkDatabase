import { gql } from "@apollo/client";
import {
  createMutateFunction,
  createQueryFunction,
  TApolloClient,
} from "./common";
import { TGroupInfo, TGroupInfoDetail } from "./types";
import { TNetworkId } from "./types/network";

export const group = <T>(client: TApolloClient<T>) => ({
  addUser: createMutateFunction<
    boolean,
    { databaseName: string; groupName: string; userNames: string[] },
    { groupAddUsers: boolean }
  >(
    client,
    gql`
      mutation GroupAddUsers(
        $networkId: NetworkId!
        $databaseName: String!
        $groupName: String!
        $userNames: [String!]!
      ) {
        groupAddUsers(
          networkId: $networkId
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
    { networkId: TNetworkId; databaseName: string; groupName: string; groupDescription: string },
    { groupChangeDescription: boolean }
  >(
    client,
    gql`
      mutation GroupChangeDescription(
        $networkId: NetworkId!
        $databaseName: String!
        $groupName: String!
        $groupDescription: String!
      ) {
        groupChangeDescription(
          networkId: $networkId
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
    { networkId: TNetworkId; databaseName: string; groupName: string; groupDescription: string },
    { groupCreate: boolean }
  >(
    client,
    gql`
      mutation GroupCreate(
        $networkId: NetworkId!
        $databaseName: String!
        $groupName: String!
        $groupDescription: String
      ) {
        groupCreate(
          networkId: $networkId
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
    { networkId: TNetworkId; databaseName: string; groupName: string; userNames: string[] },
    { groupRemoveUsers: boolean }
  >(
    client,
    gql`
      mutation GroupRemoveUsers(
        $networkId: NetworkId!
        $databaseName: String!
        $groupName: String!
        $userNames: [String!]!
      ) {
        groupRemoveUsers(
          networkId: $networkId
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
    { networkId: TNetworkId; databaseName: string; groupName: string; newGroupName: string },
    { groupRename: boolean }
  >(
    client,
    gql`
      mutation GroupRename(
        $networkId: NetworkId!
        $databaseName: String!
        $groupName: String!
        $newGroupName: String!
      ) {
        groupRename(
          networkId: $networkId
          databaseName: $databaseName
          groupName: $groupName
          newGroupName: $newGroupName
        )
      }
    `,
    (data) => data.groupRename
  ),
  info: createQueryFunction<
    TGroupInfoDetail,
    { networkId: TNetworkId; databaseName: string; groupName: string },
    { groupInfo: TGroupInfoDetail }
  >(
    client,
    gql`
      mutation GroupInfo($networkId: NetworkId!, $databaseName: String!, $groupName: String!) {
        groupInfo(networkId: $networkId, databaseName: $databaseName, groupName: $groupName)
      }
    `,
    (data) => data.groupInfo
  ),
  list: createQueryFunction<
    TGroupInfo[],
    { networkId: TNetworkId; databaseName: string },
    { groupListAll: TGroupInfo[] }
  >(
    client,
    gql`
      query GroupListAll($networkId: NetworkId!, $databaseName: String!) {
        groupListAll(networkId: $networkId, databaseName: $databaseName)
      }
    `,
    (data) => data.groupListAll
  ),
  listUser: createQueryFunction<
    string[],
    { networkId: TNetworkId; databaseName: string; userName: string },
    { groupListByUser: string[] }
  >(
    client,
    gql`
      query GroupListByUser($networkId: NetworkId!, $databaseName: String!, $userName: String!) {
        groupListByUser(networkId: $networkId, databaseName: $databaseName, userName: $userName)
      }
    `,
    (data) => data.groupListByUser
  ),
});

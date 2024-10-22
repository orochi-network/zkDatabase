import { gql } from "@apollo/client";
import {
  createMutateFunction,
  createQueryFunction,
  TApolloClient,
} from "./common";
import {
  TOwnership,
  TOwnershipRequest,
  TOwnershipResponse,
  TPermissions,
  TUser,
} from "./types";

export type TUserSignUpRecord = TUser;

export const permission = <T>(client: TApolloClient<T>) => ({
  set: createMutateFunction<
    TOwnership,
    TOwnershipRequest & {
      permission: TPermissions;
    },
    { permissionSet: TOwnershipResponse }
  >(
    client,
    gql`
      mutation PermissionSet(
        $networkId: NetworkId!
        $databaseName: String!
        $collectionName: String!
        $docId: String
        $permission: PermissionDetailInput!
      ) {
        permissionSet(
          networkId: $networkId
          databaseName: $databaseName
          collectionName: $collectionName
          docId: $docId
          permission: $permission
        ) {
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
    `,
    (data) => ({
      userName: data.permissionSet.userName,
      groupName: data.permissionSet.groupName,
      permissions: {
        permissionOwner: data.permissionSet.permissionOwner,
        permissionGroup: data.permissionSet.permissionGroup,
        permissionOther: data.permissionSet.permissionOther,
      },
    })
  ),
  get: createQueryFunction<
    TOwnership,
    TOwnershipRequest,
    { permissionList: TOwnershipResponse }
  >(
    client,
    gql`
      query PermissionList(
        $networkId: NetworkId!
        $databaseName: String!
        $collectionName: String!
        $docId: String
      ) {
        permissionList(
          networkId: $networkId
          databaseName: $databaseName
          collectionName: $collectionName
          docId: $docId
        ) {
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
    `,
    (data) => ({
      userName: data.permissionList.userName,
      groupName: data.permissionList.groupName,
      permissions: {
        permissionOwner: data.permissionList.permissionOwner,
        permissionGroup: data.permissionList.permissionGroup,
        permissionOther: data.permissionList.permissionOther,
      },
    })
  ),
});

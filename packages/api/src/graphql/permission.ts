import pkg, { ApolloClient } from "@apollo/client";
import { createMutateFunction, createQueryFunction } from "./common.js";
import {
  TOwnership,
  TOwnershipRequest,
  TOwnershipResponse,
  TPermissions,
} from "./types/ownership.js";
import { TUser } from "./types/user.js";

const { gql } = pkg;

export type TUserSignUpRecord = TUser;

export const permission = <T>(client: ApolloClient<T>) => ({
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
        $databaseName: String!
        $collectionName: String!
        $docId: String
        $permission: PermissionInput!
      ) {
        permissionSet(
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
      userGroup: data.permissionSet.userGroup,
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
        $databaseName: String!
        $collectionName: String!
        $docId: String
      ) {
        permissionList(
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
      userGroup: data.permissionList.userGroup,
      permissions: {
        permissionOwner: data.permissionList.permissionOwner,
        permissionGroup: data.permissionList.permissionGroup,
        permissionOther: data.permissionList.permissionOther,
      },
    })
  ),
});

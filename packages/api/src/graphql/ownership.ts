import { gql } from "@apollo/client";
import { createMutateFunction, TApolloClient } from "./common";
import { TOwnership, TOwnershipAndPermissionRequest, TUser } from "./types";

export type TUserSignUpRecord = TUser;

export const ownership = <T>(client: TApolloClient<T>) => ({
  setOwnership: createMutateFunction<
    TOwnership,
    TOwnershipAndPermissionRequest & { grouping: string; newOwner: string },
    { permissionOwn: TOwnership }
  >(
    client,
    gql`
      mutation PermissionOwn(
        $databaseName: String!
        $collection: String!
        $docId: String
        $grouping: PermissionGroup!
        $newOwner: String!
      ) {
        permissionOwn(
          databaseName: $databaseName
          collection: $collection
          docId: $docId
          grouping: $grouping
          newOwner: $newOwner
        ) {
          userName
          groupName
        }
      }
    `,
    (data) => data.permissionOwn
  ),
});

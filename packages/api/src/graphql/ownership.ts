import { gql } from "@apollo/client";
import { createMutateFunction, TApolloClient } from "./common";
import { TOwnership, TOwnershipRequest, TUser } from "./types";

export type TUserSignUpRecord = TUser;

export const ownership = <T>(client: TApolloClient<T>) => ({
  setOwnership: createMutateFunction<
    Pick<TOwnership, "userName" | "groupName">,
    TOwnershipRequest & { grouping: string; newOwner: string },
    { permissionOwn: Pick<TOwnership, "userName" | "groupName"> }
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

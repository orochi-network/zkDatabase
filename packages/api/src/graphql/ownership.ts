import { gql } from "@apollo/client";
import { TOwnershipDocumentOwnRequest } from "@zkdb/common";
import { createMutateFunction, TApolloClient } from "./common";

export const ownership = <T>(client: TApolloClient<T>) => ({
  setOwnership: createMutateFunction<
    boolean,
    TOwnershipDocumentOwnRequest,
    { permissionOwn: boolean }
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

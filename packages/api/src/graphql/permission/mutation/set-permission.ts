import pkg from '@apollo/client';
const { gql } = pkg;
import client from "../../client.js";
import { Permissions } from "../../types/ownership.js";
import { GraphQLResult } from "../../../utils/result.js";

const SET_PERMISSION = gql`
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
`;

export const setPermissions = async (
  databaseName: string,
  collectionName: string,
  docId: string | undefined,
  permission: Permissions
): Promise<GraphQLResult<Permissions>> => {
  try {
    const { data: {permissionSet}, errors } = await client.mutate({
      mutation: SET_PERMISSION,
      variables: {
        databaseName,
        collectionName,
        docId,
        permission,
      },
    });

    if (errors) {
      return GraphQLResult.wrap<Permissions>(
        Error(errors.map((error: any) => error.message).join(", "))
      );
    }

    return GraphQLResult.wrap<Permissions>(permissionSet);
  } catch (error) {
    if (error instanceof Error) {
      return GraphQLResult.wrap<Permissions>(error);
    } else {
      return GraphQLResult.wrap<Permissions>(Error("Unknown Error"));
    }
  }
};

import pkg from "@apollo/client";
const { gql } = pkg;
import client from "../../client.js";
import { Ownership } from "../../types/ownership.js";
import { GraphQLResult } from "../../../utils/result.js";

const LIST_PERMISSIONS = gql`
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
`;

export const listPermissions = async (
  databaseName: string,
  collectionName: string,
  docId: string | undefined
): Promise<GraphQLResult<Ownership>> => {
  try {
    const { data: {permissionList}, errors } = await client.query({
      query: LIST_PERMISSIONS,
      variables: {
        databaseName,
        collectionName,
        docId,
      },
    });


    if (errors) {
      return GraphQLResult.wrap<Ownership>(
        Error(errors.map((error: any) => error.message).join(", "))
      );
    }

    const ownership = {
      groupName: permissionList.groupName,
      userName: permissionList.userName,
      permissions: {
        permissionOwner: (({ __typename, ...rest }) => rest)(
          permissionList.permissionOwner
        ),
        permissionGroup: (({ __typename, ...rest }) => rest)(
          permissionList.permissionGroup
        ),
        permissionOther: (({ __typename, ...rest }) => rest)(
          permissionList.permissionOther
        ),
      },
    }

    return GraphQLResult.wrap<Ownership>(ownership);
  } catch (error) {
    if (error instanceof Error) {
      return GraphQLResult.wrap<Ownership>(error);
    } else {
      return GraphQLResult.wrap<Ownership>(Error("Unknown Error"));
    }
  }
};

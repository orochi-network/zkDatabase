import pkg from "@apollo/client";
const { gql } = pkg;
import { NetworkResult, handleRequest } from "../../../utils/network.js";
import client from "../../client.js";
import { Ownership } from "../../types/ownership.js";

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
): Promise<NetworkResult<Ownership>> => {
  return handleRequest(async () => {
    const { data, errors } = await client.query({
      query: LIST_PERMISSIONS,
      variables: {
        databaseName,
        collectionName,
        docId,
      },
    });

    const response = data?.permissionList;

    if (response) {
      return {
        type: "success",
        data: {
          groupName: response.groupName,
          userName: response.userName,
          permissions: {
            permissionOwner: (({ __typename, ...rest }) => rest)(
              response.permissionOwner
            ),
            permissionGroup: (({ __typename, ...rest }) => rest)(
              response.permissionGroup
            ),
            permissionOther: (({ __typename, ...rest }) => rest)(
              response.permissionOther
            ),
          },
        },
      };
    } else {
      return {
        type: "error",
        message: errors?.toString() ?? "An unknown error occurred",
      };
    }
  });
};

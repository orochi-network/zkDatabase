import pkg from "@apollo/client";
const { gql } = pkg;
import client from "../../client.js";
import { Ownership } from "../../types/ownership.js";
import { GraphQLResult } from "../../../utils/result.js";

const SET_OWNER = gql`
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
`;

export const setOwner = async (
  databaseName: string,
  collectionName: string,
  docId: string | undefined,
  grouping: string,
  newOwner: string
): Promise<GraphQLResult<Ownership>> => {
  try {
    const {
      data: { permissionOwn },
      errors,
    } = await client.mutate({
      mutation: SET_OWNER,
      variables: {
        databaseName,
        collectionName,
        docId,
        grouping,
        newOwner,
      },
    });
    if (errors) {
      return GraphQLResult.wrap<Ownership>(
        Error(errors.map((error: any) => error.message).join(", "))
      );
    }

    return GraphQLResult.wrap<Ownership>(permissionOwn);
  } catch (error) {
    if (error instanceof Error) {
      return GraphQLResult.wrap<Ownership>(error);
    } else {
      return GraphQLResult.wrap<Ownership>(Error("Unknown Error"));
    }
  }
};

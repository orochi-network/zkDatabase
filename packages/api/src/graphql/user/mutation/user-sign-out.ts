import pkg from "@apollo/client";
const { gql } = pkg;
import client from "../../client.js";
import { GraphQLResult } from "../../../utils/result.js";

export const SIGN_OUT = gql`
  mutation UserSignOut {
    userSignOut
  }
`;

export const signOut = async (): Promise<GraphQLResult<boolean>> => {
  try {
    const {
      data: { userSignOut },
      errors,
    } = await client.mutate({
      mutation: SIGN_OUT,
    });

    if (errors) {
      return GraphQLResult.wrap<boolean>(
        Error(errors.map((error: any) => error.message).join(", "))
      );
    }

    return GraphQLResult.wrap<boolean>(userSignOut);
  } catch (error) {
    if (error instanceof Error) {
      return GraphQLResult.wrap<boolean>(error);
    } else {
      return GraphQLResult.wrap<boolean>(Error("Unknown Error"));
    }
  }
};

import pkg from "@apollo/client";
const { gql } = pkg;
import client from "../../client.js";
import { SignInInfo } from "../../types/authentication.js";
import { GraphQLResult } from "../../../utils/result.js";

const SIGN_IN_DATA = gql`
  query UserSignInData {
    userSignInData {
      success
      error
      userName
      sessionKey
      sessionId
      userData
      publicKey
    }
  }
`;

export const getSignInData = async (): Promise<GraphQLResult<SignInInfo>> => {
  try {
    const {
      data: { userSignIn },
      errors,
    } = await client.query({
      query: SIGN_IN_DATA,
    });

    const info: SignInInfo = {
      user: {
        userName: userSignIn.userName,
        email: userSignIn.email,
        publicKey: userSignIn.publicKey,
      },
      session: {
        sessionId: userSignIn.sessionId,
        sessionKey: userSignIn.sessionKey,
      },
      userData: userSignIn.userData,
    };

    if (errors) {
      return GraphQLResult.wrap<SignInInfo>(
        Error(errors.map((error: any) => error.message).join(", "))
      );
    }

    return GraphQLResult.wrap<SignInInfo>(info);
  } catch (error) {
    if (error instanceof Error) {
      return GraphQLResult.wrap<SignInInfo>(error);
    } else {
      return GraphQLResult.wrap<SignInInfo>(Error("Unknown Error"));
    }
  }
};

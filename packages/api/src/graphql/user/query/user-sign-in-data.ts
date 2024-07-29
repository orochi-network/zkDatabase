import { gql } from "@apollo/client";
import client from "../../client.js";
import { SignInInfo } from "../../types/authentication.js";
import { NetworkResult } from "../../../utils/network.js";

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

interface UserSignInResponse {
  success: boolean;
  error: string | null;
  userName: string;
  email: string;
  sessionKey: string;
  sessionId: string;
  userData: JSON;
  publicKey: string;
}

export const getSignInData = async (
  token: string
): Promise<NetworkResult<SignInInfo>> => {
  try {
    const { data } = await client.query<{ userSignIn: UserSignInResponse }>({
      query: SIGN_IN_DATA,
      context: {
        headers: {
          authorization: `Bearer ${token}`,
        },
      },
    });

    const response = data?.userSignIn;

    if (response && response.success) {
      return {
        type: "success",
        data: {
          user: {
            userName: response.userName,
            email: response.email,
            publicKey: response.publicKey
          },
          session: {
            sessionId: response.sessionId,
            sessionKey: response.sessionKey,
          },
          userData: response.userData,
        },
      };
    } else {
      return {
        type: "error",
        message: response?.error ?? "An unknown error occurred",
      };
    }
  } catch (error) {
    return {
      type: "error",
      message: `${(error as any).message}` ?? "An unknown error occurred",
    };
  }
};

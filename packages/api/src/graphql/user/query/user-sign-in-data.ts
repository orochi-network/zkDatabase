import { gql } from "@apollo/client";
import { NetworkResult } from "../../../common/result";
import client from "../../client";
import { SignInInfo, SignatureProofData } from "../../types/authentication";

const SIGN_IN_DATA = gql`
  query UserSignInData {
    userSignInData {
      success
      error
      userName
      sessionKey
      sessionId
      userData
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

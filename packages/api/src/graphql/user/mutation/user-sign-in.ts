import { gql } from "@apollo/client";
import client from "../../client";
import { SignInInfo, SignatureProofData } from "../../types/authentication";
import { NetworkResult } from "../../../utils/network";

const SIGN_IN = gql`
  mutation UserSignIn($proof: SignatureProof!) {
    userSignIn(proof: $proof) {
      success
      error
      userName
      email
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

export const signIn = async (
  proof: SignatureProofData
): Promise<NetworkResult<SignInInfo>> => {
  try {
    const { data } = await client.mutate<{ userSignIn: UserSignInResponse }>({
      mutation: SIGN_IN,
      variables: { proof },
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

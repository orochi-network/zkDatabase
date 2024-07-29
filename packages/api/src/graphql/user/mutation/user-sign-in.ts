import { gql } from "@apollo/client";
import client from "../../client.js";
import { SignInInfo, SignatureProofData } from "../../types/authentication.js";
import { NetworkResult } from "../../../utils/network.js";

const SIGN_IN = gql`
  mutation UserSignIn($proof: ProofInput!) {
    userSignIn(proof: $proof) {
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
  sessionKey: string;
  sessionId: string;
  userData: JSON;
}

export const signIn = async (
  email: string,
  proof: SignatureProofData
): Promise<NetworkResult<SignInInfo>> => {
  try {
    const { errors, data } = await client.mutate({
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
            email: email,
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
        message: errors?.toString() ?? "An unknown error occurred",
      };
    }
  } catch (error) {
    return {
      type: "error",
      message: `${(error as any).message}` ?? "An unknown error occurred",
    };
  }
};

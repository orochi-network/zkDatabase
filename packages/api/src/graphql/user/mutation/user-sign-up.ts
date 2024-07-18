import { gql } from "@apollo/client";
import client from "../../client.js";
import {
  SignUpData,
  SignUpInfo,
  SignatureProofData,
} from "../../types/authentication.js";
import { NetworkResult } from "../../../utils/network.js";

const SIGN_UP = gql`
  mutation UserSignUp($signUp: SignUp!, $proof: ProofInput!) {
    userSignUp(signUp: $signUp, proof: $proof) {
      success
      error
      userName
      email
      publicKey
    }
  }
`;

interface UserSignUpResponse {
  success: boolean;
  error: string;
  userName: string;
  email: string;
  publicKey: string;
}

export const signUp = async (
  proof: SignatureProofData,
  signUpData: SignUpData
): Promise<NetworkResult<SignUpInfo>> => {
  try {
    const { data } = await client.mutate<{ userSignUp: UserSignUpResponse }>({
      mutation: SIGN_UP,
      variables: { signUp: signUpData, proof: proof },
    });

    const response = data?.userSignUp;

    if (response && response.success) {
      return {
        type: "success",
        data: {
          user: {
            userName: response.userName,
            email: response.email,
          },
          publicKey: response.publicKey,
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

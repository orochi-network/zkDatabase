import pkg from '@apollo/client';
const { gql } = pkg;
import client from "../../client.js";
import { SignUpData, SignatureProofData } from "../../types/authentication.js";
import { NetworkResult } from "../../../utils/network.js";
import { User } from "../../types/user.js";

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
): Promise<NetworkResult<User>> => {
  try {
    const { data, errors } = await client.mutate({
      mutation: SIGN_UP,
      variables: { signUp: signUpData, proof: proof },
    });

    const response = data?.userSignUp;

    if (response && response.success) {
      return {
        type: "success",
        data: {
          userName: response.userName,
          email: response.email,
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

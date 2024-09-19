import { gql } from "@apollo/client";
import client from "../../client.js";
import { SignUpData, SignatureProofData } from "../../types/authentication.js";
import { User } from "../../types/user.js";
import { GraphQLResult } from "../../../utils/result.js";

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

export const signUp = async (
  proof: SignatureProofData,
  signUpData: SignUpData
): Promise<GraphQLResult<User>> => {
  try {
    const {
      data: { userSignUp },
      errors,
    } = await client.mutate({
      mutation: SIGN_UP,
      variables: { signUp: signUpData, proof: proof },
    });

    if (errors) {
      return GraphQLResult.wrap<User>(
        Error(errors.map((error: any) => error.message).join(", "))
      );
    }

    const user: User = {
      userName: userSignUp.userName,
      email: userSignUp.email,
      publicKey: userSignUp.publicKey,
    };

    return GraphQLResult.wrap<User>(user);
  } catch (error) {
    if (error instanceof Error) {
      return GraphQLResult.wrap<User>(error);
    } else {
      return GraphQLResult.wrap<User>(Error("Unknown Error"));
    }
  }
};

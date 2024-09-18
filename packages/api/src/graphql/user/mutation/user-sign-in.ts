import pkg from "@apollo/client";
const { gql } = pkg;
import client from "../../client.js";
import { SignInInfo, SignatureProofData } from "../../types/authentication.js";
import { GraphQLResult } from "../../../utils/result.js";

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

export const signIn = async (
  email: string,
  proof: SignatureProofData
): Promise<GraphQLResult<SignInInfo>> => {
  try {
    const {
      errors,
      data: { userSignIn },
    } = await client.mutate({
      mutation: SIGN_IN,
      variables: { proof },
    });

    if (errors) {
      return GraphQLResult.wrap<SignInInfo>(
        Error(errors.map((error: any) => error.message).join(", "))
      );
    }

    const info: SignInInfo = {
      user: {
        userName: userSignIn.userName,
        email: email,
        publicKey: userSignIn.publicKey,
      },
      session: {
        sessionId: userSignIn.sessionId,
        sessionKey: userSignIn.sessionKey,
      },
      userData: userSignIn.userData,
    };

    return GraphQLResult.wrap<SignInInfo>(info);
  } catch (error) {
    if (error instanceof Error) {
      return GraphQLResult.wrap<SignInInfo>(error);
    } else {
      return GraphQLResult.wrap<SignInInfo>(Error("Unknown Error"));
    }
  }
};

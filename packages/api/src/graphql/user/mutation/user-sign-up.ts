import pkg from "@apollo/client";
import {
  TSignUpData,
  TSignatureProofData,
} from "../../types/authentication.js";
import { TUser } from "../../types/user.js";
import { createMutateFunction } from "../../common.js";
const { gql } = pkg;

export type TUserSignUpRecord = TUser;

/**
 * Mutation function to sign up a new user.
 *
 * @function
 * @template TUser - The user type.
 * @template TSignatureProofData - The signature proof data type.
 * @template TSignUpData - The sign-up data type.
 * @template TUserSignUpRecord - The user sign-up record type.
 *
 * @param {TUser} TUser - The user type.
 * @param {Object} variables - The variables for the mutation.
 * @param {TSignatureProofData} variables.proof - The proof data for the sign-up.
 * @param {TSignUpData} variables.signUp - The sign-up data.
 * @returns {TAsyncGraphQLResult<TUserSignUpRecord>} - The user sign-up record.
 */
export const signUp = createMutateFunction<
  TUser,
  { proof: TSignatureProofData; signUp: TSignUpData },
  { userSignUp: TUserSignUpRecord }
>(
  gql`
    mutation UserSignUp($signUp: SignUp!, $proof: ProofInput!) {
      userSignUp(signUp: $signUp, proof: $proof) {
        userName
        email
        publicKey
      }
    }
  `,
  (data) => data.userSignUp
);

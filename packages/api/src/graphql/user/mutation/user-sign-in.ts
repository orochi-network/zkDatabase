import pkg from "@apollo/client";
import {
  TSignInInfo,
  TSignatureProofData,
} from "../../types/authentication.js";
import { createMutateFunction } from "../../common.js";
const { gql } = pkg;

/**
 * Signs in a user using the provided signature proof data.
 *
 * @function
 * @template TSignInInfo - The type of the sign-in information.
 * @param {TSignatureProofData} proof - The proof data required for user sign-in.
 * @returns {TAsyncGraphQLResult<TSignInInfo>} The sign-in information of the user.
 *
 * @example
 * ```typescript
 * const signInInfo = await signIn({ proof: proofData });
 * console.log(signInInfo.userName);
 * ```
 */
export const signIn = createMutateFunction<
  TSignInInfo,
  { proof: TSignatureProofData },
  { userSignIn: TSignInInfo }
>(
  gql`
    mutation UserSignIn($proof: ProofInput!) {
      userSignIn(proof: $proof) {
        userName
        accessToken
        userData
        publicKey
      }
    }
  `,
  (data) => data.userSignIn
);

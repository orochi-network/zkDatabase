import { gql } from "@apollo/client";
import {
  createMutateFunction,
  createQueryFunction,
  TApolloClient,
} from "./common";
import {
  TSignatureProofData,
  TSignInInfo,
  TSignUpData,
  TUser,
  TPagination,
  TPaginationResponse,
} from "./types";

export type TUserSignUpRecord = TUser;

/**
 * Represents the record of a user sign-in.
 *
 * @typedef {Object} TUserSignInRecord
 * @property {string} userName - The username of the user.
 * @property {string} email - The email address of the user.
 * @property {string} accessToken - The access token provided upon sign-in.
 * @property {JSON} userData - Additional user data in JSON format.
 * @property {string} publicKey - The public key associated with the user.
 */
export type TUserSignInRecord = {
  userName: string;
  email: string;
  accessToken: string;
  userData: any;
  publicKey: string;
};

/**
 * Represents the response received after a user sign-in operation.
 *
 * @typedef {Object} TUserSignInResponse
 * @property {TUserSignInRecord} userSignIn - The record containing user sign-in details.
 */
export type TUserSignInResponse = {
  userSignIn: TUserSignInRecord;
};

const USER_SIGN_IN = gql`
  mutation UserSignIn($proof: ProofInput!) {
    userSignIn(proof: $proof) {
      userName
      accessToken
      userData
      publicKey
    }
  }
`;

const USER_SIGN_OUT = gql`
  mutation UserSignOut {
    userSignOut
  }
`;

const USER_SIGN_UP = gql`
  mutation UserSignUp($signUp: SignUp!, $proof: ProofInput!) {
    userSignUp(signUp: $signUp, proof: $proof) {
      userName
      email
      publicKey
    }
  }
`;

const USER_FIND = gql`
  query FindUser($query: JSON, $pagination: PaginationInput) {
    findUser(query: $query, pagination: $pagination) {
      totalSize
      offset
      data {
        email
        publicKey
        userName
      }
    }
  }
`;

const USER_INFO = gql`
  query UserSignInData {
    userSignInData {
      userName
      accessToken
      userData
      publicKey
    }
  }
`;

const ECDSA = gql`
  mutation UserGetEcdsaChallenge {
    userGetEcdsaChallenge
  }
`;

export const user = <T>(client: TApolloClient<T>) => ({
  signIn: createMutateFunction<
    TSignInInfo,
    { proof: TSignatureProofData },
    { userSignIn: TSignInInfo }
  >(client, USER_SIGN_IN, (data) => data.userSignIn),
  signOut: createMutateFunction<boolean, undefined, { userSignOut: boolean }>(
    client,
    USER_SIGN_OUT,
    (data) => data.userSignOut
  ),
  signUp: createMutateFunction<
    TUser,
    { proof: TSignatureProofData; signUp: TSignUpData },
    { userSignUp: TUserSignUpRecord }
  >(client, USER_SIGN_UP, (data) => data.userSignUp),
  ecdsa: createMutateFunction<
    string,
    undefined,
    { userGetEcdsaChallenge: string }
  >(client, ECDSA, (data) => data.userGetEcdsaChallenge),
  findMany: createQueryFunction<
    TUser[],
    { query: Partial<TUser>; pagination?: TPagination },
    { findUser: TPaginationResponse<TUser[]> }
  >(client, USER_FIND, (data) => data.findUser.data),
  userInfo: createQueryFunction<
    TUserSignInRecord,
    undefined,
    TUserSignInResponse
  >(client, USER_INFO, (data) => data.userSignIn),
});

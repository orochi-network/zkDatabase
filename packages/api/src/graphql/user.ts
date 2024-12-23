import { gql } from "@apollo/client";
import {
  TUserEcdsaChallengeRequest,
  TUserEcdsaChallengeResponse,
  TUserFindRequest,
  TUserFindResponse,
  TUserMeRequest,
  TUserMeResponse,
  TUserSignInRequest,
  TUserSignInResponse,
  TUserSignOutRequest,
  TUserSignOutResponse,
  TUserSignUpRequest,
  TUserSignUpResponse,
} from "@zkdb/common";
import {
  createMutateFunction,
  createQueryFunction,
  TApolloClient,
} from "./common";

export const user = <T>(client: TApolloClient<T>) => ({
  userSignIn: createMutateFunction<TUserSignInRequest, TUserSignInResponse>(
    client,
    gql`
      mutation userSignIn($proof: ProofInput!) {
        userSignIn(proof: $proof) {
          userName
          accessToken
          userData
          publicKey
          email
        }
      }
    `,
    (data) => data.userSignIn
  ),
  userSignOut: createMutateFunction<TUserSignOutRequest, TUserSignOutResponse>(
    client,
    gql`
      mutation userSignOut {
        userSignOut
      }
    `,
    (data) => data.userSignOut
  ),
  userSignUp: createMutateFunction<TUserSignUpRequest, TUserSignUpResponse>(
    client,
    gql`
      mutation userSignUp($newUser: SignUpInput!, $proof: ProofInput!) {
        userSignUp(newUser: $newUser, proof: $proof) {
          userName
          email
          userData
          publicKey
          activated
          createdAt
          updatedAt
        }
      }
    `,
    (data) => data.userSignUp
  ),
  userEcdsaChallenge: createMutateFunction<
    TUserEcdsaChallengeRequest,
    TUserEcdsaChallengeResponse
  >(
    client,
    gql`
      mutation userEcdsaChallenge {
        userEcdsaChallenge
      }
    `,
    (data) => data.userEcdsaChallenge
  ),
  userFind: createQueryFunction<TUserFindRequest, TUserFindResponse>(
    client,
    gql`
      query userFind($query: UserFindQueryInput, $pagination: PaginationInput) {
        userFind(query: $query, pagination: $pagination) {
          data {
            ...UserFragment
          }
          total
          offset
        }
      }
    `,
    (data) => data.userFind
  ),
  userMe: createQueryFunction<TUserMeRequest, TUserMeResponse>(
    client,
    gql`
      query userMe {
        userMe {
          userName
          accessToken
          userData
          publicKey
          email
        }
      }
    `,
    (data) => data.userMe
  ),
});

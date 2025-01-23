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
import { createApi, TApolloClient } from "./common";

export const API_USER = <T>(client: TApolloClient<T>) => ({
  userSignIn: createApi<TUserSignInRequest, TUserSignInResponse>(
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
    `
  ),
  userSignOut: createApi<TUserSignOutRequest, TUserSignOutResponse>(
    client,
    gql`
      mutation userSignOut {
        userSignOut
      }
    `
  ),
  userSignUp: createApi<TUserSignUpRequest, TUserSignUpResponse>(
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
    `
  ),
  userEcdsaChallenge: createApi<
    TUserEcdsaChallengeRequest,
    TUserEcdsaChallengeResponse
  >(
    client,
    gql`
      mutation userEcdsaChallenge {
        userEcdsaChallenge
      }
    `
  ),
  userFind: createApi<TUserFindRequest, TUserFindResponse>(
    client,
    gql`
      query userFind($query: UserFindQueryInput, $pagination: PaginationInput) {
        userFind(query: $query, pagination: $pagination) {
          data {
            activated
            email
            publicKey
            userName
          }
          total
          offset
        }
      }
    `
  ),
  userMe: createApi<TUserMeRequest, TUserMeResponse>(
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
    `
  ),
});

export default API_USER;

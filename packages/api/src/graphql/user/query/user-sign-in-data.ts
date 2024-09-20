import pkg from "@apollo/client";
import { createQueryFunction } from "../common.js";
const { gql } = pkg;

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

/**
 * Executes a GraphQL query to retrieve user sign-in data.
 *
 * @function
 * @template TUserSignInRecord - The type of the user sign-in record.
 * @template TUserSignInResponse - The type of the user sign-in response.
 * @param {DocumentNode} query - The GraphQL query document.
 * @param {any} [variables] - Optional variables for the query.
 * @param {function} transform - A function to transform the query result.
 * @returns {TAsyncGraphQLResult<TUserSignInResponse>} The user sign-in response.
 *
 * @example
 * getSignInData().then(response => {
 *   if (response.success) {
 *     console.log('User signed in:', response.userName);
 *   } else {
 *     console.error('Sign-in error:', response.error);
 *   }
 * });
 */
export const getSignInData = createQueryFunction<
  TUserSignInRecord,
  undefined,
  TUserSignInResponse
>(
  gql`
    query UserSignInData {
      userSignInData {
        userName
        accessToken
        userData
        publicKey
      }
    }
  `,
  (data) => data.userSignIn
);

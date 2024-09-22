import pkg from "@apollo/client";
import { createMutateFunction } from "../../common.js";
const { gql } = pkg;

/**
 * Signs out the current user.
 *
 * This function sends a GraphQL mutation to sign out the user and returns a boolean indicating the success of the operation.
 *
 * @returns {TAsyncGraphQLResult<boolean>} A promise that resolves to a boolean indicating whether the sign-out was successful.
 */
export const signOut = createMutateFunction<
  boolean,
  undefined,
  { userSignOut: boolean }
>(
  gql`
    mutation UserSignOut {
      userSignOut
    }
  `,
  (data) => data.userSignOut
);

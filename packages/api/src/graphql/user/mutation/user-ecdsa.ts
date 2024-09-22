import pkg from "@apollo/client";
const { gql } = pkg;
import { createMutateFunction } from "../../common.js";

export const getEcdsa = createMutateFunction<
  string,
  undefined,
  { userGetEcdsaChallenge: string }
>(
  gql`
    mutation UserGetEcdsaChallenge {
      userGetEcdsaChallenge
    }
  `,
  (data) => data.userGetEcdsaChallenge
);

import pkg from "@apollo/client";
import {
  createMutateFunction,
  TAsyncGraphQLResult,
} from "graphql/user/common.js";
import { TZKProof } from "../../types/proof.js";
const { gql } = pkg;

/**
 * Fetches a zero-knowledge proof from the specified database.
 *
 * This function sends a GraphQL query to retrieve a proof object, which includes
 * the public input, public output, maximum number of proofs verified, and the proof itself.
 *
 * @param databaseName - The name of the database from which to retrieve the proof.
 * @returns {TAsyncGraphQLResult<TZKProof>} A promise that resolves to a `TZKProof` object containing the proof details.
 */
export const getProof = createMutateFunction<
  TZKProof,
  { databaseName: string },
  { getProof: TZKProof }
>(
  gql`
    query GetProof($databaseName: String!) {
      getProof(databaseName: $databaseName) {
        publicInput
        publicOutput
        maxProofsVerified
        proof
      }
    }
  `,
  (data) => data.getProof
);

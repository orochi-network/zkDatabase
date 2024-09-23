import pkg, { ApolloClient } from "@apollo/client";
import { createQueryFunction } from "./common.js";
import { TProofStatus, TProofStatusRequest, TZKProof } from "./types/proof.js";
import { TUser } from "./types/user.js";

const { gql } = pkg;

export type TUserSignUpRecord = TUser;

export const ownership = <T>(client: ApolloClient<T>) => ({
  status: createQueryFunction<
    TProofStatus,
    TProofStatusRequest,
    { getProofStatus: TProofStatus }
  >(
    client,
    gql`
      query GetProofStatus(
        $databaseName: String!
        $collectionName: String!
        $docId: String!
      ) {
        getProofStatus(
          databaseName: $databaseName
          collectionName: $collectionName
          docId: $docId
        )
      }
    `,
    (data) => data.getProofStatus
  ),
  proof: createQueryFunction<
    TZKProof,
    { databaseName: string },
    { getProof: TZKProof }
  >(
    client,
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
  ),
});

import { gql } from "@apollo/client";
import { createQueryFunction, TApolloClient } from "./common";
import { TProofStatus, TProofStatusRequest, TZKProof, TUser } from "./types";
import { TNetworkId } from "./types/network";
export type TUserSignUpRecord = TUser;

export const proof = <T>(client: TApolloClient<T>) => ({
  status: createQueryFunction<
    TProofStatus,
    TProofStatusRequest,
    { getProofStatus: TProofStatus }
  >(
    client,
    gql`
      query GetProofStatus(
        $networkId: NetworkId!
        $databaseName: String!
        $collectionName: String!
        $docId: String!
      ) {
        getProofStatus(
          networkId: $networkId
          databaseName: $databaseName
          collectionName: $collectionName
          docId: $docId
        )
      }
    `,
    (data) => data.getProofStatus
  ),
  get: createQueryFunction<
    TZKProof,
    { networkId: TNetworkId, databaseName: string },
    { getProof: TZKProof }
  >(
    client,
    gql`
      query GetProof($networkId: NetworkId!, $databaseName: String!) {
        getProof(networkId: $networkId, databaseName: $databaseName) {
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

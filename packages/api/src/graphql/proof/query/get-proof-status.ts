import pkg from '@apollo/client';
const { gql } = pkg;
import { NetworkResult } from "../../../utils/network.js";
import { handleRequest } from "../../../utils/network.js";
import client from "../../client.js";
import { ProofStatus } from "../../types/proof.js";

const GET_PROOF_STATUS = gql`
  query GetProofStatus($databaseName: String!, $collectionName: String!, $docId: String!) {
    getProofStatus(databaseName: $databaseName, collectionName: $collectionName, docId: $docId)
  }
`;

export const getProofStatus = async (
  databaseName: string,
  collectionName: string,
  docId: string
): Promise<NetworkResult<ProofStatus>> => {
  return handleRequest(async () => {
    const { data, errors } = await client.query({
      query: GET_PROOF_STATUS,
      variables: {
        databaseName,
        collectionName,
        docId
      }
    });

    const response = data?.getProofStatus;

    if (response) {
      return {
        type: "success",
        data: response,
      };
    } else {
      return {
        type: "error",
        message: errors?.toString() ?? "An unknown error occurred",
      };
    }
  });
};

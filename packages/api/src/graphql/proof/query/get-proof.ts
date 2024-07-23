import { gql } from "@apollo/client";
import { NetworkResult } from "../../../utils/network.js";
import { handleRequest } from "../../../utils/network.js";
import client from "../../client.js";
import { ZKProof } from "../../types/proof.js";

const GET_PROOF = gql`
  query GetProof($databaseName: String!) {
    getProof(databaseName: $databaseName)
  }
`;

export const getProof = async (
  databaseName: string,
): Promise<NetworkResult<ZKProof>> => {
  return handleRequest(async () => {
    const { data, errors } = await client.query({
      query: GET_PROOF,
      variables: {
        databaseName
      }
    });

    const response = data?.getProof;

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

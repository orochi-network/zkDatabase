import pkg from "@apollo/client";
const { gql } = pkg;
import client from "../../client.js";
import { ZKProof } from "../../types/proof.js";
import { GraphQLResult } from "../../../utils/result.js";

const GET_PROOF = gql`
  query GetProof($databaseName: String!) {
    getProof(databaseName: $databaseName) {
      publicInput
      publicOutput
      maxProofsVerified
      proof
    }
  }
`;

export const getProof = async (
  databaseName: string
): Promise<GraphQLResult<ZKProof>> => {
  try {
    const {
      data: { getProof },
      errors,
    } = await client.query({
      query: GET_PROOF,
      variables: {
        databaseName,
      },
    });

    if (errors) {
      return GraphQLResult.wrap<ZKProof>(
        Error(errors.map((error: any) => error.message).join(", "))
      );
    }

    return GraphQLResult.wrap<ZKProof>(getProof);
  } catch (error) {
    if (error instanceof Error) {
      return GraphQLResult.wrap<ZKProof>(error);
    } else {
      return GraphQLResult.wrap<ZKProof>(Error("Unknown Error"));
    }
  }
};

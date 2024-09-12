import pkg from "@apollo/client";
const { gql } = pkg;
import client from "../../client.js";
import { ProofStatus } from "../../types/proof.js";
import { GraphQLResult } from "../../../utils/result.js";

const GET_PROOF_STATUS = gql`
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
`;

export const getProofStatus = async (
  databaseName: string,
  collectionName: string,
  docId: string
): Promise<GraphQLResult<ProofStatus>> => {
  try {
    const {
      data: { getProofStatus },
      errors,
    } = await client.query({
      query: GET_PROOF_STATUS,
      variables: {
        databaseName,
        collectionName,
        docId,
      },
    });

    if (errors) {
      return GraphQLResult.wrap<ProofStatus>(
        Error(errors.map((error: any) => error.message).join(", "))
      );
    }

    return GraphQLResult.wrap<ProofStatus>(getProofStatus);
  } catch (error) {
    if (error instanceof Error) {
      return GraphQLResult.wrap<ProofStatus>(error);
    } else {
      return GraphQLResult.wrap<ProofStatus>(Error("Unknown Error"));
    }
  }
};

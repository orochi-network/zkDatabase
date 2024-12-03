export const typeDefsProof = `#graphql
  scalar JSON
  type Query

  type Proof {
    publicInput: [String!]!
    publicOutput: [String!]!
    maxProofsVerified: Int!
    proof: String!
  }

  enum ProofStatus {
    QUEUED
    PROVING
    PROVED
    FAILED
  }

  enum DatabaseProofStatus {
    EMPTY
    PENDING
    PROVED
  }

  extend type Query {
    getProofStatus(databaseName: String!, collectionName: String!, docId: String): ProofStatus!
    getDatabaseProofStatus(databaseName: String!): DatabaseProofStatus!
    getProof(databaseName: String!): Proof
  }
`;

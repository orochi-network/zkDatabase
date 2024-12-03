export const typeDefsMerkleTree = `#graphql
  scalar JSON
  type Query
  type Mutation

  type MerkleProof {
    isLeft: Boolean!
    sibling: String!
  }

  type MerkleNode {
    index: Int!,
    level: Int!,
    hash: String!
    empty: Boolean!
  }

  type MerkleWitnessNode {
    hash: String!
    level: Int!
    index: Int!
    witness: Boolean!
    target: Boolean!
  }

  type MerkleNodePaginationOutput {
    data: [MerkleNode]!
    totalSize: Int!
    offset: Int!
  }

  type MerkleTreeInfo {
    merkleRoot: String!
    merkleHeight: Int!
  }

  extend type Query {
    getNode(databaseName: String!, level: Int!, index: String!): String!
    getNodesByLevel(databaseName: String!, level: Int!, pagination: PaginationInput): MerkleNodePaginationOutput!
    getChildrenNodes(databaseName: String!, level: Int!, index: String!): [MerkleNode!]!
    getMerkleTreeInfo(databaseName: String!): MerkleTreeInfo!
    getRoot(databaseName: String!): String!
    getWitness(databaseName: String!, index: String!): [MerkleProof]!
    getWitnessByDocument(databaseName: String!, docId: String!): [MerkleProof]!
    getWitnessPath(databaseName: String!, docId: String!): [MerkleWitnessNode]!
  }
`;

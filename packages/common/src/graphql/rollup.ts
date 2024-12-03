export const typeDefsRollUp = `#graphql
  scalar Date
  type Mutation

  enum RollUpState {
    updated
    outdated
    failed
  }

  type RollUpHistoryItem {
    databaseName: String!
    transactionType: TransactionType!
    transactionHash: String,
    status: TransactionStatus!,
    currentMerkleTreeRoot: String!,
    previousMerkleTreeRoot: String!,
    createdAt: Date!
    error: String
  }

  type RollUpHistory {
    state: RollUpState!,
    extraData: Int,
    history: [RollUpHistoryItem]!
  }

  extend type Mutation {
    getRollUpHistory(databaseName: String!): RollUpHistory!
    createRollUp(databaseName: String!): Boolean
  }
`;

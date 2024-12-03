export const typeDefsTransaction = `#graphql
  scalar JSON
  type Query
  type Mutation

  enum TransactionType {
    deploy
    rollup
  }

  type DbTransaction {
    databaseName: String!
    transactionType: TransactionType!
    zkAppPublicKey: String!
    status: TransactionStatus!
    tx: String!
    id: String!
  }

  extend type Query {
    getTransaction(databaseName: String!, transactionType: TransactionType!): DbTransaction!
  }

  extend type Mutation {
    enqueueDeployTransaction(databaseName: String!): String!
    confirmTransaction(databaseName: String!, id: String!, txHash: String!): Boolean
  }
`;

export const typeDefsDatabase = `#graphql
  scalar JSON
  type Query
  type Mutation

  type DbSetting {
    merkleHeight: Int!
    publicKey: String
    databaseOwner: String!,
  }

  input PaginationInput {
    limit: Int,
    offset: Int
  }

  type Collection {
    name: String!
  }

  type DbDeploy {
    databaseName: String!
    merkleHeight: Int!
    appPublicKey: String!
    tx: String!
  }

  type DbDescription {
    databaseName: String!,
    databaseSize: String!,
    databaseOwner: String!,
    appPublicKey: String,
    merkleHeight: Int!,
    deployStatus: TransactionStatus,
    collections: [CollectionDescriptionOutput]!
  }

  type DatabasePaginationOutput {
    data: [DbDescription]!
    totalSize: Int!
    offset: Int!
  }

  extend type Query {
    dbList(query: JSON, pagination: PaginationInput): DatabasePaginationOutput!
    dbStats(databaseName: String!): JSON
    dbSetting(databaseName: String!): DbSetting!
    dbExist(databaseName: String!): Boolean!
    #dbFindIndex(databaseName: String!, index: Int!): JSON
  }

  extend type Mutation {
    dbCreate(databaseName: String!, merkleHeight: Int!): Boolean
    dbChangeOwner(databaseName: String!, newOwner: String!): Boolean
    dbDeployedUpdate(databaseName: String!, appPublicKey: String!): Boolean
    #dbDrop(databaseName: String!): Boolean
  }
`;

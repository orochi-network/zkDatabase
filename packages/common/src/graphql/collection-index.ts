export const typeDefsCollectionIndex = `#graphql
  scalar JSON
  scalar Date
  type Query
  type Mutation

  type CollectionIndex {
    name: String!
    size: Int!
    accesses: Int!
    since: Date!
    properties: String!
  }

  extend type Query {
    indexList(databaseName: String!, collectionName: String!): [String]!
    indexListInfo(databaseName: String!, collectionName: String!): [CollectionIndex]!
    indexExist(
      databaseName: String!
      collectionName: String!
      indexName: String!
    ): Boolean
  }

  extend type Mutation {
    indexCreate(
      databaseName: String!
      collectionName: String!
      indexes: [IndexInput!]!
    ): Boolean
    indexDrop(
      databaseName: String!
      collectionName: String!
      indexName: String!
    ): Boolean
  }
`;

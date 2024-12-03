export const typeDefsCollection = `#graphql
  scalar JSON
  type Query
  type Mutation

  extend type Query {
    collectionList(databaseName: String!): [CollectionDescriptionOutput]!
    collectionExist(databaseName: String!, collectionName: String!): Boolean
  }

  extend type Mutation {
    collectionCreate(
      databaseName: String!,
      collectionName: String!,
      groupName: String!,
      schema: [SchemaFieldInput!]!,
      indexes: [IndexInput],
      permissions: PermissionDetailInput
    ): Boolean
  }
`;

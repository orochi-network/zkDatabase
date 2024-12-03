export const typeDefsPermission = `#graphql
  scalar JSON
  type Query
  type Mutation

  enum PermissionGroup {
    User
    Group
    Other
  }

  enum OwnershipGroup {
    User
    Group
  }

  # If docId is not provided, it will return the permission of the collection
  extend type Query {
    permissionList(
      databaseName: String!
      collectionName: String!
      docId: String
    ): CollectionMetadataOutput

    collectionSchema(
      databaseName: String!
      collectionName: String!
    ): [SchemaFieldOutput!]
  }

  extend type Mutation {
    permissionSet(
      databaseName: String!
      collectionName: String!
      docId: String
      permission: PermissionDetailInput!
    ): CollectionMetadataOutput!

    permissionOwn(
      databaseName: String!
      collectionName: String!
      docId: String
      grouping: OwnershipGroup!
      newOwner: String!
    ): CollectionMetadataOutput
  }
`;

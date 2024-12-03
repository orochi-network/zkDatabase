export const typeDefsDocument = `#graphql
  scalar JSON
  type Query
  type Mutation

  type MerkleWitness {
    isLeft: Boolean!
    sibling: String!
  }

  input PermissionRecordInput {
    system: Boolean
    create: Boolean
    read: Boolean
    write: Boolean
    delete: Boolean
  }

  input PermissionDetailInput {
    permissionOwner: PermissionRecordInput
    permissionGroup: PermissionRecordInput
    permissionOther: PermissionRecordInput
  }

  type DocumentsWithMetadataOutput {
    document: DocumentOutput!
    metadata: DocumentMetadataOutput!
    proofStatus: String
  }

  type DocumentPaginationOutput {
    data: [DocumentOutput]!
    totalSize: Int!
    offset: Int!
  }

  extend type Query {
    documentFind(
      databaseName: String!
      collectionName: String!
      documentQuery: JSON!
    ): DocumentOutput
    documentsFind(
      databaseName: String!
      collectionName: String!
      documentQuery: JSON!
      pagination: PaginationInput
    ): DocumentPaginationOutput!
    documentsWithMetadataFind(
      databaseName: String!
      collectionName: String!
      query: JSON!
      pagination: PaginationInput
    ): [DocumentsWithMetadataOutput]!
  }

  extend type Mutation {
    documentCreate(
      databaseName: String!
      collectionName: String!
      documentRecord: [DocumentRecordInput!]!
      documentPermission: PermissionDetailInput
    ): [MerkleWitness!]!

    documentUpdate(
      databaseName: String!
      collectionName: String!
      documentQuery: JSON!
      documentRecord: [DocumentRecordInput!]!
    ): [MerkleWitness!]!

    documentDrop(
      databaseName: String!
      collectionName: String!
      documentQuery: JSON!
    ): [MerkleWitness!]!
  }
`;

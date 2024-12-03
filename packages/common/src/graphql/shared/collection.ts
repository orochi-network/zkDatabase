export const typeCommonDefsCollection = `#graphql
  scalar JSON
  scalar Date

  input SchemaFieldInput {
    name: String!
    kind: String!
  }

  type SchemaFieldOutput {
    order: Int!,
    name: String!
    kind: String!
    indexed: Boolean
  }

  type CollectionDescriptionOutput {
    name: String!
    indexes: [String]!
    schema: [SchemaFieldOutput!]!
    ownership : CollectionMetadataOutput!
    sizeOnDisk: Int!
  }
`;

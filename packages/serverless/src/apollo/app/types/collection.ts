// eslint-disable-next-line import/prefer-default-export
export const typeCommonDefsCollection = `#graphql
scalar JSON
scalar Date

input SchemaFieldInput {
  name: String!
  kind: String!
  indexed: Boolean
}

type SchemaFieldOutput {
  name: String!
  kind: String!
  indexed: Boolean
}

type CollectionDescriptionOutput {
  name: String!
  indexes: [String]!,
  schema: [SchemaFieldOutput!]!,
  metadata : CollectionMetadataOutput!
}
`;

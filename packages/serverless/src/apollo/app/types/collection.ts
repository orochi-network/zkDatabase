// eslint-disable-next-line import/prefer-default-export
export const typeCommonDefsCollection = `#graphql
scalar JSON
scalar Date

enum ESchemaType {
  CircuitString
  UInt32
  UInt64
  Bool
  Sign
  Character
  Int64
  Field
  PrivateKey
  PublicKey
  Signature
  MerkleMapWitness
}

input SchemaFieldInput {
  name: String!
  kind: ESchemaType!
}

type SchemaFieldOutput {
  order: Int!,
  name: String!
  kind: ESchemaType!
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

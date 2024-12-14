import { gql } from '../../helper/common.js';

export const typeDefsCommon = gql`
  enum TransactionType {
    Deploy
    Rollup
  }

  enum TransactionStatus {
    Unsigned
    Signed
    Unconfirmed
    Confirming
    Failed
    Confirmed
    Unknown
  }

  enum Sorting {
    Asc
    Desc
  }

  enum SchemaType {
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

  enum CollectionIndexProperty {
    Compound
    Unique
  }

  type IndexInput {
    name: String!
    sorting: Sorting!
  }

  type PaginationInput {
    offset: Int!
    limit: Int!
  }

  input MinaSignatureInput {
    field: String!
    scalar: String!
  }

  input ProofInput {
    signature: MinaSignatureInput!
    publicKey: String!
    data: String!
  }

  input SchemaFieldInput {
    name: String!
    kind: SchemaType!
    index: Boolean
    # Default is Asc or 1
    sorting: Sorting
  }

  type SchemaFieldOutput {
    name: String!
    kind: SchemaType!
    index: Boolean
    # Default is ASC or 1
    sorting: Sorting
  }

  type CollectionMetadata {
    owner: String!
    group: String!
    permission: Int!
  }

  type MetadataCollection {
    permission: Int!
    collectionName: String!
    createdAt: Date!
    updatedAt: Date!
    sizeOnDisk: Int
    schema: [SchemaFieldOutput]!
  }

  type CollectionDescriptionOutput {
    collectionName: String!
    schema: [SchemaFieldOutput!]!
    owner: String!
    group: String!
    permission: Int!
    sizeOnDisk: Int!
  }
`;

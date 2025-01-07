import { gql } from '@helper';

export const typeDefsCommon = gql`
  scalar Date

  enum TransactionType {
    Deploy
    Rollup
  }

  # ETransactionStatus in TS
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

  # EIndexProperty in TS
  enum IndexProperty {
    Compound
    Single
  }

  type IndexInput {
    name: String!
    sorting: Sorting!
  }

  input PaginationInput {
    offset: Int
    limit: Int
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
  }

  type SchemaFieldOutput {
    name: String!
    kind: SchemaType!
  }
`;

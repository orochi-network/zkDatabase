import { gql } from '../../helper/common.js';

export const typeDefsCommon = gql`
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

  type IndexInput {
    name: String!
    sorting: Sorting!
  }

  type SchemaFieldInput {
    name: String!
    kind: SchemaType!
    indexed: Boolean
    # Default is ASC or -1
    sorting: Sorting
  }

  type SchemaFieldOutput {
    order: Int!
    name: String!
    kind: SchemaType!
    indexed: Boolean
    # Default is ASC or -1
    sorting: Sorting
  }

  type CollectionMetadataOutput {
    owner: String!
    group: String!
    permission: Int!
  }

  type ACollectionMetadata {
    permission: Int!;
    collection: string!;
    _id: ObjectId!;
    createdAt: Date!;
    updatedAt: Date!;
    field: [String]!;
    definition: [SchemaDefinition]!;

}

  type CollectionDescriptionOutput {
    name: String!
    index: [String]!
    schema: [SchemaFieldOutput!]!
    ownership: CollectionMetadataOutput!
    sizeOnDisk: Int!
  }
`;

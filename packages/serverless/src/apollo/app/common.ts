import { gql } from '@helper';
import { GraphQLScalarType } from 'graphql';
import { GraphQLJSONObject } from 'graphql-type-json';

export const typeDefsCommon = gql`
  scalar Date
  scalar JSON

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

/** Recusively traverse through an object and convert all field with bigint to
 * string */
function convertBigIntToString(obj: any): any {
  if (typeof obj === 'bigint') {
    return obj.toString();
  }
  if (Array.isArray(obj)) {
    return obj.map((item) => convertBigIntToString(item));
  }
  if (typeof obj === 'object') {
    Object.keys(obj).forEach((key) => {
      // eslint-disable-next-line no-param-reassign
      obj[key] = convertBigIntToString(obj[key]);
    });
  }
  return obj;
}

export const resolversCommon = {
  JSON: new GraphQLScalarType({
    name: 'JSON',
    description: 'JSON scalar type (aka Object)',
    serialize(value) {
      return GraphQLJSONObject.serialize(convertBigIntToString(value));
    },
    parseValue(value) {
      return GraphQLJSONObject.parseValue(value);
    },
  }),
};

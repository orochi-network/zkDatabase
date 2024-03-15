/* eslint-disable max-classes-per-file */
import {
  Poseidon,
  InferProvable,
  CircuitString,
  UInt32,
  Bool,
  Field,
  UInt64,
  Character,
  Int64,
  Sign,
  PublicKey,
  PrivateKey,
  Signature,
  MerkleMapWitness,
  Struct,
} from 'o1js';

export interface SchemaExtend {
  serialize(): SchemaEncoded;
  hash(): Field;
}

export interface SchemaStaticExtend<A> {
  deserialize(_doc: SchemaEncoded): InstanceType<SchemaExtendable<A>>;
  getSchema(): SchemaDefinition;
}

export type SchemaExtendable<A> = Struct<InferProvable<A> & SchemaExtend> &
  SchemaStaticExtend<A>;

export const ProvableTypeMap = {
  CircuitString: CircuitString,
  UInt32: UInt32,
  UInt64: UInt64,
  Bool: Bool,
  Sign: Sign,
  Character: Character,
  Int64: Int64,
  Field: Field,
  PrivateKey: PrivateKey,
  PublicKey: PublicKey,
  Signature: Signature,
  MerkleMapWitness: MerkleMapWitness,
} as const;

export type ProvableTypeString = keyof typeof ProvableTypeMap;

export type SchemaFieldDefinition = {
  name: string;
  kind: ProvableTypeString;
  indexed: boolean;
};

export type SchemaDefinition = SchemaFieldDefinition[];

export type ProvableMapped<T extends SchemaDefinition> = {
  [Property in T[number]['name']]?: (typeof ProvableTypeMap)[ProvableTypeString];
};

export function toInnerStructure<T extends SchemaDefinition>(
  schema: T
): ProvableMapped<T> {
  const result: Partial<ProvableMapped<T>> = {};
  schema.forEach(({ name, kind }) => {
    const key = name as keyof ProvableMapped<T>;
    result[key] = ProvableTypeMap[kind];
  });
  return result as ProvableMapped<T>;
}

type Indexes<T> = Array<keyof T>;

export type SchemaEncoded = [
  name: string,
  kind: ProvableTypeString,
  value: string,
][];

export class Schema {
  public static create<A, T extends InferProvable<A> = InferProvable<A>>(
    type: A,
    indexes: Indexes<A> = []
  ): SchemaExtendable<A> & (new (..._args: T[]) => T) {
    class Document extends Struct(type) {
      private static schemaEntries: SchemaFieldDefinition[] = Object.entries(
        type as any
      ).map(([name, kind]): SchemaFieldDefinition => {
        return {
          name,
          kind: (kind as any).name.replace(/^_/, ''),
          indexed: indexes.includes(name as keyof A),
        };
      });

      public static getSchema(): SchemaDefinition {
        return Document.schemaEntries.map(({ name, kind, indexed }) => ({
          name,
          kind,
          indexed,
        }));
      }

      // Serialize the document to a Uint8Array
      serialize(): SchemaEncoded {
        const anyThis = <any>this;
        const result: any = [];
        for (let i = 0; i < Document.schemaEntries.length; i += 1) {
          const { name, kind } = Document.schemaEntries[i];
          let value = 'N/A';
          switch (kind) {
            case 'PrivateKey':
            case 'PublicKey':
            case 'Signature':
              value = anyThis[name].toBase58();
              break;
            default:
              value = anyThis[name].toString();
          }
          result.push([name, kind, value]);
        }
        return result;
      }

      // Returns the hash of the document
      hash(): Field {
        return Poseidon.hash(Document.toFields(<any>this));
      }

      static deserialize(doc: SchemaEncoded): Document {
        const result: any = {};

        for (let i = 0; i < doc.length; i += 1) {
          const [name, kind, value] = doc[i];

          switch (kind) {
            case 'PrivateKey':
            case 'PublicKey':
            case 'Signature':
              result[name] = ProvableTypeMap[kind].fromBase58(value);
              break;
            case 'MerkleMapWitness':
              throw new Error('MerkleMapWitness is not supported');
            case 'UInt32':
            case 'UInt64':
            case 'Int64':
            case 'Field':
              result[name] = ProvableTypeMap[kind].from(value);
              break;
            case 'Bool':
              result[name] =
                value.toLowerCase() === 'true'
                  ? new Bool(true)
                  : new Bool(false);
              break;
            case 'Sign':
              result[name] =
                value.toLowerCase() === 'true' ? Sign.minusOne : Sign.one;
              break;
            default:
              result[name] = ProvableTypeMap[kind].fromString(value);
          }
        }
        return new Document(result);
      }
    }

    return Document as any;
  }

  public static fromRecord(record: string[][]) {
    return this.fromSchema(
      record.map(([name, kind, indexed]) => ({
        name,
        kind: kind as ProvableTypeString,
        indexed: indexed === 'true',
      }))
    );
  }

  public static fromSchema(schema: SchemaDefinition) {
    return Schema.create(toInnerStructure(schema));
  }
}

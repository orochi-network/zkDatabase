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

export const ProvableTypeMap = {
  CircuitString,
  UInt32,
  UInt64,
  Bool,
  Sign,
  Character,
  Int64,
  Field,
  PrivateKey,
  PublicKey,
  Signature,
  MerkleMapWitness,
} as const;

export type TProvableTypeString = keyof typeof ProvableTypeMap;

export type TSchemaField = {
  name: string;
  kind: TProvableTypeString;
  value: string;
};

export type TSchemaEncoded = TSchemaField[];

export type SchemaFieldDefinition = {
  name: string;
  kind: TProvableTypeString;
};

export type TSchemaDefinition = SchemaFieldDefinition[];

export interface SchemaExtend {
  serialize(): TSchemaEncoded;
  hash(): Field;
}
export interface SchemaStaticExtend<A> {
  // eslint-disable-next-line no-use-before-define
  deserialize(_doc: TSchemaEncoded): InstanceType<SchemaExtendable<A>>;
  getSchema(): TSchemaDefinition;
}

export type SchemaExtendable<A> = Struct<InferProvable<A> & SchemaExtend> &
  SchemaStaticExtend<A>;

export type ProvableMapped<T extends TSchemaDefinition> = {
  [Property in T[number]['name']]?: (typeof ProvableTypeMap)[TProvableTypeString];
};

export function toInnerStructure<T extends TSchemaDefinition>(
  schema: T
): ProvableMapped<T> {
  const result: Partial<ProvableMapped<T>> = {};
  schema.forEach(({ name, kind }) => {
    const key = name as keyof ProvableMapped<T>;
    result[key] = ProvableTypeMap[kind];
  });
  return result as ProvableMapped<T>;
}

export class Schema {
  public static create<A, T extends InferProvable<A> = InferProvable<A>>(
    type: A
  ): SchemaExtendable<A> & (new (..._args: T[]) => T) {
    class Document extends Struct(type) {
      private static schemaEntries: SchemaFieldDefinition[] = Object.entries(
        type as any
      ).map(([name, kind]): SchemaFieldDefinition => {
        return {
          name,
          kind: (kind as any).name.replace(/^_/, ''),
        };
      });

      public static getSchema(): TSchemaDefinition {
        return Document.schemaEntries.map(({ name, kind }) => ({
          name,
          kind,
        }));
      }

      // Serialize the document to a Uint8Array
      serialize(): TSchemaEncoded {
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
          result.push({ name, kind, value });
        }
        return result;
      }

      // Returns the hash of the document
      hash(): Field {
        return Poseidon.hash(Document.toFields(<any>this));
      }

      static deserialize(doc: TSchemaEncoded): Document {
        const result: any = {};

        for (let i = 0; i < doc.length; i += 1) {
          const { name, kind, value } = doc[i];

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
      record.map(([name, kind]) => ({
        name,
        kind: kind as TProvableTypeString,
      }))
    );
  }

  public static fromSchema(schema: TSchemaDefinition) {
    return Schema.create(toInnerStructure(schema));
  }
}

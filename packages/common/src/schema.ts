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
import { TMerkleNodeJson } from './types/merkle-tree';

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

/** Map of Provable types to their corresponding JavaScript types. */
type TProvableSerializationMap = {
  CircuitString: string;
  UInt32: number;
  Int64: bigint;
  UInt64: bigint;
  Bool: boolean;
  PrivateKey: string;
  PublicKey: string;
  Signature: string;
  Character: string;
  Sign: boolean;
  Field: string;
  MerkleMapWitness: TMerkleNodeJson[];
};

/**
 * Represents all possible serialized values that can be stored in a provable
 * field. This is a union type of all values in the TProvableSerializationMap.
 */
export type TProvableSerializationValue =
  TProvableSerializationMap[keyof TProvableSerializationMap];

/**
 * Represents a field with a name, kind, and the actual value.
 * Rendered as a union of all possible field types.
 * ```ts
 * type TContractSchemaField = {
 *     name: string;
 *     kind: "CircuitString";
 *     value: string;
 * } | {
 *     name: string;
 *     kind: "UInt32";
 *     value: bigint;
 * } | {
 * } | ... 7 more ... | {
 *     ...;
 * }
 * ```
 */
export type TContractSchemaField = {
  [K in TProvableTypeString]: {
    name: string;
    kind: K;
    value: TProvableSerializationMap[K];
  };
}[TProvableTypeString];

export type TContractSchemaFieldDefinition = Omit<
  TContractSchemaField,
  'value'
>;

export interface SchemaExtend {
  serialize(): TContractSchemaField[];
  hash(): Field;
}
export interface SchemaStaticExtend<A> {
  // eslint-disable-next-line no-use-before-define
  deserialize(_doc: TContractSchemaField[]): InstanceType<SchemaExtendable<A>>;
  getSchema(): TContractSchemaFieldDefinition[];
}

export type SchemaExtendable<A> = Struct<InferProvable<A> & SchemaExtend> &
  SchemaStaticExtend<A>;

export type ProvableMapped<T extends TContractSchemaFieldDefinition[]> = {
  [Property in T[number]['name']]?: (typeof ProvableTypeMap)[TProvableTypeString];
};

export function toInnerStructure<T extends TContractSchemaFieldDefinition[]>(
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
      private static schemaEntries: TContractSchemaFieldDefinition[] =
        Object.entries(type as any).map(
          ([name, kind]): TContractSchemaFieldDefinition => {
            return {
              name,
              kind: (kind as any).name.replace(/^_/, ''),
            };
          }
        );

      public static getSchema(): TContractSchemaFieldDefinition[] {
        return Document.schemaEntries.map(({ name, kind }) => ({
          name,
          kind,
        }));
      }

      // Serialize the document to a Uint8Array
      serialize(): TContractSchemaField[] {
        const anyThis = <any>this;
        const result: any = [];
        for (let i = 0; i < Document.schemaEntries.length; i += 1) {
          const { name, kind } = Document.schemaEntries[i];
          let value: TProvableSerializationValue;
          switch (kind) {
            case 'PrivateKey':
            case 'PublicKey':
            case 'Signature':
              value = anyThis[name].toBase58();
              break;
            case 'MerkleMapWitness':
              throw new Error('MerkleMapWitness is not supported');
            case 'UInt64':
              value = (anyThis[name] as UInt64).toBigInt();
              break;
            case 'Field':
              value = anyThis[name].toString();
              break;
            case 'UInt32':
              value = (anyThis[name] as UInt32).toBigint();
              break;
            case 'Int64':
              value = (anyThis[name] as Int64).toBigint();
              break;
            case 'Bool':
              value = (anyThis[name] as Bool).toBoolean();
              break;
            case 'Sign':
              value = (anyThis[name] as Sign).isPositive().toBoolean();
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

      static deserialize(doc: TContractSchemaField[]): Document {
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
            case 'UInt64':
            case 'Field':
            case 'UInt32':
            case 'Int64':
              result[name] = ProvableTypeMap[kind].from(value);
              break;
            case 'Bool':
              result[name] = new Bool(value);
              break;
            case 'Sign':
              // True = 1
              // False = -1
              result[name] = value ? Sign.one : Sign.minusOne;
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

  public static fromSchema(schema: TContractSchemaFieldDefinition[]) {
    return Schema.create(toInnerStructure(schema));
  }
}

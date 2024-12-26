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

export const PROVABLE_TYPE_MAP = {
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

export type TProvableType =
  (typeof PROVABLE_TYPE_MAP)[keyof typeof PROVABLE_TYPE_MAP];

export type TProvableTypeString = keyof typeof PROVABLE_TYPE_MAP;

export type TSchemaQueryMap<T> = {
  [K in keyof T]: T[K] extends typeof UInt64
    ? bigint
    : T[K] extends typeof Int64
      ? bigint
      : T[K] extends typeof Sign
        ? boolean
        : T[K] extends typeof Bool
          ? boolean
          : T[K] extends typeof UInt32
            ? number
            : T[K] extends MerkleMapWitness
              ? TMerkleNodeJson[]
              : string; // Fallback to `any` if the type is not recognized
};

/** Map of Provable types to their corresponding JavaScript types. */
type TProvableToSerializedMap = {
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
 * field. This is a union type of all values in the TProvableToSerializedMap.
 */
export type TSerializedValue =
  TProvableToSerializedMap[keyof TProvableToSerializedMap];

/**
 * Represents a field with a name, kind, and the actual value.
 * Rendered as a union of all possible field types.
 * ```ts
 * type TSchemaSerializedField = {
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
export type TSchemaSerializedField = {
  [K in TProvableTypeString]: {
    name: string;
    kind: K;
    value: TProvableToSerializedMap[K];
  };
}[TProvableTypeString];

export type TSchemaSerializedFieldDefinition = Omit<
  TSchemaSerializedField,
  'value'
>;

export interface ISchemaExtend {
  serialize(): TSchemaSerializedField[];
  hash(): Field;
}

export type TSchemaExtendable<A> = Struct<InferProvable<A> & ISchemaExtend> &
  ISchemaStatic<A>;

export interface ISchemaStatic<A> {
  innerStructure: TSchemaQueryMap<A>;
  // eslint-disable-next-line no-use-before-define
  deserialize(
    doc: TSchemaSerializedField[]
  ): InstanceType<TSchemaExtendable<A>>;
  getSchemaDefinition(): TSchemaSerializedFieldDefinition[];
}

export type TProvableMapped<T extends TSchemaSerializedFieldDefinition[]> = {
  [Property in T[number]['name']]?: (typeof PROVABLE_TYPE_MAP)[TProvableTypeString];
};

function toInnerStructure<T extends TSchemaSerializedFieldDefinition[]>(
  schema: T
): TProvableMapped<T> {
  const result: Partial<TProvableMapped<T>> = {};
  schema.forEach(({ name, kind }) => {
    const key = name as keyof TProvableMapped<T>;
    result[key] = PROVABLE_TYPE_MAP[kind];
  });
  return result as TProvableMapped<T>;
}

export class Schema {
  public static create<A, T extends InferProvable<A> = InferProvable<A>>(
    type: A
  ): TSchemaExtendable<A> & (new (..._args: T[]) => T) {
    class SchemaProvable extends Struct(type) {
      public innerStructure: TSchemaQueryMap<A> = type as any;

      private static schemaEntries: TSchemaSerializedFieldDefinition[] =
        Object.entries(type as any).map(
          ([name, kind]): TSchemaSerializedFieldDefinition => {
            return {
              name,
              kind: (kind as any).name.replace(/^_/, ''),
            };
          }
        );

      public static getSchemaDefinition(): TSchemaSerializedFieldDefinition[] {
        return SchemaProvable.schemaEntries.map(({ name, kind }) => ({
          name,
          kind,
        }));
      }

      // Serialize the document to a Uint8Array
      serialize(): TSchemaSerializedField[] {
        const anyThis = <any>this;
        const result: any = [];
        for (let i = 0; i < SchemaProvable.schemaEntries.length; i += 1) {
          const { name, kind } = SchemaProvable.schemaEntries[i];
          let value: TSerializedValue;
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
              value = Number((anyThis[name] as UInt32).toBigint());
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
        return Poseidon.hash(SchemaProvable.toFields(<any>this));
      }

      static deserialize(doc: TSchemaSerializedField[]): SchemaProvable {
        const result: any = {};

        for (let i = 0; i < doc.length; i += 1) {
          const { name, kind, value } = doc[i];

          switch (kind) {
            case 'PrivateKey':
            case 'PublicKey':
            case 'Signature':
              result[name] = PROVABLE_TYPE_MAP[kind].fromBase58(value);
              break;
            case 'MerkleMapWitness':
              throw new Error('MerkleMapWitness is not supported');
            case 'UInt64':
            case 'Field':
            case 'UInt32':
            case 'Int64':
              result[name] = PROVABLE_TYPE_MAP[kind].from(value);
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
              result[name] = PROVABLE_TYPE_MAP[kind].fromString(value);
          }
        }
        return new SchemaProvable(result);
      }
    }

    return SchemaProvable as any;
  }

  public static fromEntries(record: string[][]) {
    return this.fromSchema(
      record.map(([name, kind]) => ({
        name,
        kind: kind as TProvableTypeString,
      }))
    );
  }

  public static fromSchema(schema: TSchemaSerializedFieldDefinition[]) {
    return Schema.create(toInnerStructure(schema));
  }
}

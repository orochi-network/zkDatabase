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
  Struct
} from 'o1js';
export { Field } from 'o1js';

export interface SchemaExtend {
  serialize(): SchemaEncoded;
  hash(): Field;
}

export interface SchemaStaticExtend<A> {
  deserialize(_doc: SchemaEncoded): InstanceType<SchemaExtendable<A>>;
}

export type SchemaExtendable<A> = Struct<InferProvable<A> & SchemaExtend> &
  SchemaStaticExtend<A>;

export type ProvableTypeString =
  | 'CircuitString'
  | 'UInt32'
  | 'UInt64'
  | 'Bool'
  | 'Sign'
  | 'Character'
  | 'Int64'
  | 'Field'
  | 'PrivateKey'
  | 'PublicKey'
  | 'Signature'
  | 'MerkleMapWitness';

const ProvableTypeMap = {
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
};

export type ProvableMapped<T extends { [key: string]: ProvableTypeString }> = {
  [Property in keyof T]: (typeof ProvableTypeMap)[T[Property]];
};

export function toInnerStructure<
  T extends { [key: string]: ProvableTypeString }
>(schema: T): ProvableMapped<T> {
  const result: any = {};
  const keys: ProvableTypeString[] = Object.keys(schema) as any;
  for (let i = 0; i < keys.length; i++) {
    result[keys[i]] = ProvableTypeMap[schema[keys[i]]];
  }
  return result;
}

/*
const ProvableTypeMap = new Map<
  ProvableType,
  (typeof ProvableMap)[ProvableType]
>([
  ['CircuitString', CircuitString],
  ['UInt32', UInt32],
  ['UInt64', UInt64],
  ['Bool', Bool],
  ['Sign', Sign],
  ['Character', Character],
  ['Int64', Int64],
  ['Field', Field],
  ['PrivateKey', PrivateKey],
  ['PublicKey', PublicKey],
  ['Signature', Signature],
  ['MerkleMapWitness', MerkleMapWitness],
]);*/

export type SchemaDefinition = {
  [k: string]: ProvableTypeString;
};

export type SchemaEncoded = [
  name: string,
  kind: ProvableTypeString,
  value: string
][];

export class Schema {
  public static create<A, T extends InferProvable<A> = InferProvable<A>>(
    type: A
  ): SchemaExtendable<A> & (new (...args: T[]) => T) {
    console.log(type);

    class Document extends Struct(type) {
      constructor(...args: T[]) {
        super(...args);
      }

      private static schemaEntries = Object.entries(type as any).map(
        ([key, value]): [string, ProvableTypeString] => {
          return [key, (value as any).name];
        }
      );

      public static schema: SchemaDefinition = Object.fromEntries(
        Document.schemaEntries
      );

      // Serialize the document to a Uint8Array
      serialize(): SchemaEncoded {
        const anyThis = <any>this;
        const result: any = [];
        for (let i = 0; i < Document.schemaEntries.length; i += 1) {
          const [key, kind] = Document.schemaEntries[i];
          let value = 'N/A';
          switch (kind) {
            case 'PrivateKey':
            case 'PublicKey':
            case 'Signature':
              value = anyThis[key].toBase58();
              break;
            default:
              value = anyThis[key].toString();
          }
          result.push([key, kind, value]);
        }
        return result;
      }

      // Returns the hash of the document
      hash(): Field {
        return Poseidon.hash(Document.toFields(<any>this));
      }

      static deserialize(doc: SchemaEncoded): Document {
        const result: any = {};
        for (let i = 0; i < doc.length; i++) {
          const [key, kind, value] = doc[i];
          switch (kind) {
            case 'PrivateKey':
            case 'PublicKey':
            case 'Signature':
              result[key] = ProvableTypeMap[kind].fromBase58(value);
              break;
            case 'MerkleMapWitness':
              throw new Error('MerkleMapWitness is not supported');
            case 'UInt32':
            case 'UInt64':
            case 'Int64':
            case 'Field':
              result[key] = ProvableTypeMap[kind].from(value);
              break;
            case 'Bool':
              result[key] =
                value.toLowerCase() === 'true'
                  ? new Bool(true)
                  : new Bool(false);
              break;
            case 'Sign':
              result[key] =
                value.toLowerCase() === 'true' ? Sign.minusOne : Sign.one;
              break;
            default:
              result[key] = ProvableTypeMap[kind].fromString(value);
          }
        }
        return new Document(result);
      }
    }

    return Document as any;
  }

  public static fromRecord(record: string[][]) {
    return Schema.fromSchema(
      Object.fromEntries(
        record.map(([name, kind, _value]) => [name, kind as ProvableTypeString])
      )
    );
  }

  public static fromSchema(schema: SchemaDefinition) {
    return Schema.create(toInnerStructure(schema));
  }
}

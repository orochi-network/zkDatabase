import { Struct, Poseidon, Field, InferProvable } from 'snarkyjs';
import { BSON } from 'bson';
export { Field } from 'snarkyjs';

export interface ISchema {
  serialize(): Uint8Array;
  hash(): Field;
}

export type SchemaExtendable = <T>(_type: T) => Struct<
  T & InferProvable<T> & ISchema
> & {
  decode: (_doc: Uint8Array) => T;
};

export const Schema: SchemaExtendable = <A>(type: A) => {
  class Document extends Struct(type) {
    serialize(): Uint8Array {
      const anyThis = <any>this;
      const keys = Object.keys(type as any);
      const result: any = {};
      for (let i = 0; i < keys.length; i += 1) {
        const key = keys[i];
        if (typeof anyThis[key].toString !== 'undefined') {
          result[key] = anyThis[key].toString();
        } else if (typeof anyThis[key].toBase58 !== 'undefined') {
          result[key] = anyThis[key].toBase58();
        } else {
          throw new Error(`Cannot serialize ${key}`);
        }
      }

      return BSON.serialize(result);
    }

    hash(): Field {
      return Poseidon.hash(Document.toFields(<any>this));
    }
  }

  (Document as any).decode = (doc: Uint8Array): any => {
    const entires = Object.entries(<any>type);
    const docObj = BSON.deserialize(doc);
    const result: any = {};
    for (let i = 0; i < entires.length; i += 1) {
      const [key, value] = entires[i];
      const anyValue = <any>value;

      if (typeof anyValue.fromBase58 !== 'undefined') {
        result[key] = anyValue.fromBase58(docObj[key]);
      } else if (typeof anyValue.from !== 'undefined') {
        result[key] = anyValue.from(docObj[key]);
      } else if (typeof anyValue.fromString !== 'undefined') {
        result[key] = anyValue.fromString(docObj[key]);
      } else {
        throw new Error(`Cannot deserialize ${key}`);
      }
    }
    return <any>result;
  };

  return Document as any;
};

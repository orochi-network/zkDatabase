import { Struct, Poseidon, Field, InferProvable } from 'o1js';
import { BSON } from 'bson';
export { Field } from 'o1js';

/**
 * Interface for a schema
 */
export interface ISchema {
  serialize(): Uint8Array;
  hash(): Field;
}

/**
 * Document schema is a wrapper for SnarkyJS Struct
 * It provides the following additional methods:
 * - serialize(): Serializes the document to a Uint8Array
 * - hash(): Returns the hash of the document
 * - decode(): Deserializes the document from a Uint8Array
 *
 * That makes it possible to use the document schema in the following way:
 *
 * ```ts
 * // Define the schema of the document
 * class Account extends Schema({
 *   accountName: CircuitString,
 *   balance: UInt32,
 * }) {
 *   // Deserialize the document from a Uint8Array
 *   static deserialize(data: Uint8Array): Account {
 *     return new Account(Account.decode(data));
 *   }
 *
 *   // Index the document by accountName
 *   index(): { accountName: string } {
 *     return {
 *       accountName: this.accountName.toString(),
 *     };
 *   }
 *
 *   // Serialize the document to a json object
 *   json(): { accountName: string; balance: string } {
 *     return {
 *       accountName: this.accountName.toString(),
 *       balance: this.balance.toString(),
 *     };
 *   }
 * }
 * ```
 * @template T The inner type of struct of document
 * @param _type The inner struct of document
 */
export type SchemaExtendable = <T>(_type: T) => Struct<
  T & InferProvable<T> & ISchema
> & {
  decode: (_doc: Uint8Array) => T;
};

export const Schema: SchemaExtendable = <A>(type: A) => {
  class Document extends Struct(type) {
    // Serialize the document to a Uint8Array
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

    // Returns the hash of the document
    hash(): Field {
      return Poseidon.hash(Document.toFields(<any>this));
    }
  }

  // Deserialize the document from a Uint8Array
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

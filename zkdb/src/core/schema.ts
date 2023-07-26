import { Struct, Poseidon, Field, InferProvable } from 'snarkyjs';
import { BSON } from 'bson';
export { Field } from 'snarkyjs';

export type SchemaExtendable<
  D,
  A,
  T extends InferProvable<A> = InferProvable<A>
> = D & {
  new (_type: any): SchemaExtendable<D, A>;

  deserialize: (_doc: Uint8Array) => any;

  extends: <M extends { [key: string]: unknown }>(
    _proto: M
  ) => (new (_type: any) => SchemaExtendable<D, A> & M & T) &
    SchemaExtendable<D, A>;
};

export const Schema = <A>(type: A) => {
  class Document extends Struct(type) {
    deserialize = (doc: Uint8Array): this => {
      const entires = Object.entries(<any>type);
      const docObj = BSON.deserialize(doc);
      const result: any = {};
      for (let i = 0; i < entires.length; i += 1) {
        const [key, value] = entires[i];
        result[key] =
          typeof (<any>value).fromString !== 'undefined'
            ? (<any>value).fromString(docObj[key])
            : (<any>value).from(docObj[key]);
      }
      return <any>new Document(result);
    };

    serialize(): Uint8Array {
      const keys = Object.keys(type as any);
      const result: any = {};
      for (let i = 0; i < keys.length; i += 1) {
        const key = keys[i];
        result[key] = (this as any)[key].toString();
      }

      return BSON.serialize(result);
    }

    hash(): Field {
      return Poseidon.hash(Document.toFields(<any>this));
    }
  }

  (<SchemaExtendable<Document, A>>(Document as unknown)).extends = (
    proto: any
  ) => {
    const entries = Object.entries(proto);

    for (let i = 0; i < entries.length; i += 1) {
      const [key, value] = entries[i];
      (<any>Document).prototype[key] = value;
    }
    return <any>Document;
  };

  return <SchemaExtendable<Document, A>>(Document as unknown);
};

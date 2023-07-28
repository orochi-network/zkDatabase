import { Field } from 'snarkyjs';

export interface IKeyValue {
  [key: string]: string;
}

export type TEntries = [string, string][];

export interface IMerkleStorage {
  [level: number]: { [node: string]: string };
}

export type IDocument = {
  hash(): Field;
  index(): IKeyValue;
  serialize(): Uint8Array;
};

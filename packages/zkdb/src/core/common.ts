import { Field } from 'snarkyjs';
import {
  TDelegatedIPFSConfig,
  TLocalConfig,
} from '../storage-engine/common.js';

/**
 * Interface for key-value pairs
 */
export interface IKeyValue {
  [key: string]: string;
}

/**
 * Type for an array of key-value pairs
 */
export type TEntries = [string, string][];

/**
 * Interface for a Merkle tree storage
 */
export interface IMerkleStorage {
  [level: number]: { [node: string]: string };
}

/**
 * Interface for a document
 */
export type IDocument = {
  /**
   * Returns the hash of the document
   */
  hash(): Field;
  /**
   * Returns the index of the document
   */
  index(): IKeyValue;
  /**
   * Serializes the document to a Uint8Array
   */
  serialize(): Uint8Array;
};

export type TZKDatabaseConfig =
  | {
      storageEngine: 'local';
      merkleHeight: number;
      storageEngineCfg: TLocalConfig;
    }
  | {
      storageEngine: 'delegated-ipfs';
      merkleHeight: number;
      storageEngineCfg: TDelegatedIPFSConfig;
    };

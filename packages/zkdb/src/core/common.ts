import { Field } from 'o1js';
import { TKuboConfig } from '@zkdb/kubo';

/**
 * Common interface for file system
 * @param S - Content ID could be filename or content ID depends on implementation
 * @param T - Content unique ID, it could be uuid or CID depends on implementation
 * @param R - Data type, it could be string or Uint8Array depends on implementation
 */
export interface IFileSystem<S, T, R> {
  /**
   * Write data type R to file system with a given filename and return content ID
   * @param _filename Filename
   * @param _data Data in bytes
   * @returns Data in T
   */
  write(_filename: S, _data: R): Promise<T>;

  /**
   * Write data type R to file system
   * @param _filename Filename
   * @param _data Data in bytes
   * @returns Data in T
   */
  writeBytes(_data: R): Promise<T>;

  /**
   * Read data type R from file system with a given content ID/filename
   * @param _contentID Content ID
   * @returns Data in R
   */
  read(_filename: S): Promise<R>;

  /**
   * Remove file from file system with a given content ID/filename
   * @param _contentID Content ID or filename
   * @returns true if success otherwise false
   */
  remove(_filename: S): Promise<boolean>;
}

/**
 * Method that performing index and lookup file
 * @param S - Peer ID
 * @param T - Content ID
 * @param R - IPNS entry
 */
export interface IFileIndex<S, T, R> {
  /**
   * Publish file to IPNS
   * @param _contentID Content ID
   * @returns An entry from IPNS
   */
  publish(_contentID: T): Promise<R>;

  /**
   * Republish file to IPNS
   * @returns An entry from IPNS
   */
  republish(): void;

  /**
   * Resolve file CID from IPNS
   * @param _peerID Peer ID of p2p node
   * @returns Content ID
   */
  resolve(_peerID?: S): Promise<T | undefined>;
}

/**
 * Storage handler
 * @var file File storage
 * @var memory Memory storage
 */
export type TLocalStorage = 'file' | 'memory';

/**
 * Basic storage configuration
 * @var handler Storage handler
 */
export type TMemoryStorage = {
  handler: 'memory';
};

/**
 * File storage configuration
 * @var location Location of the storage
 */
export type TFileStorage = {
  handler: 'file';
  location: string;
};

/**
 * Storage configuration
 */
export type THeliaConfig = TMemoryStorage | TFileStorage;

export type TDeletatedKuboConfig = Partial<TKuboConfig> & {
  username: string;
  secretAPIKey: string;
};

export type TDelegatedIPFSConfig = {
  kubo: Partial<TKuboConfig>;
  database: string;
};

export type TLocalConfig = {
  location: string;
};

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
    }
  | {
      storageEngine: 'memory';
      merkleHeight: number;
    };

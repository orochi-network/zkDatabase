import { Libp2p, Libp2pOptions, createLibp2p } from 'libp2p';
import { TIPFSFileSystem, TIPFSFileIndex } from './common.js';
import { tcp } from '@libp2p/tcp';
import { kadDHT } from '@libp2p/kad-dht';
import { noise } from '@chainsafe/libp2p-noise';
import { MemoryDatastore } from 'datastore-core';
import { webSockets } from '@libp2p/websockets';
import { multiaddr } from '@multiformats/multiaddr';
import { yamux } from '@chainsafe/libp2p-yamux';
import { FsDatastore } from 'datastore-fs';
import { FsBlockstore } from 'blockstore-fs';
import { createHelia } from 'helia';
import { UnixFS, unixfs } from '@helia/unixfs';
import { Helia } from '@helia/interface';
import { IPNS, ipns } from '@helia/ipns';
import { CID, Version } from 'multiformats';
import { PeerId } from '@libp2p/interface-peer-id';
import { IPNSEntry } from 'ipns';
import fs from 'fs';
import { Binary, Helper } from '../utilities/index.js';
import { BSON } from 'bson';

/**
 * Transport layer
 * @var tcp TCP transport
 * @var websocket Websocket transport
 */
export type TTransport = 'tcp' | 'websocket';

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
export interface IBasicStorageConfiguration {
  handler: TLocalStorage;
}

/**
 * File storage configuration
 * @var location Location of the storage
 */
export interface IStorageFileConfiguration extends IBasicStorageConfiguration {
  location: string;
}

/**
 * Storage configuration
 */
export type TStorageConfiguration =
  | IBasicStorageConfiguration
  | IStorageFileConfiguration;

/**
 * IPFS configuration
 */
export interface IIPFSConfiguration {
  transport: TTransport;
  storageP2p: TStorageConfiguration;
  storageHelia: TStorageConfiguration;
}

/**
 * Metadata filename
 */
export const METADATA_FILENAME = 'metadata';

/**
 * New instance of libp2p
 * @param transport transport layer
 * @param storage storage configuration
 * @returns libp2p instance
 */
const newLibP2p = async (
  transport: TTransport,
  storage: TStorageConfiguration
): Promise<Libp2p> => {
  const config: Libp2pOptions = {
    start: true,
    addresses: {
      listen: ['/ip4/127.0.0.1/tcp/0'],
    },
    dht: kadDHT(),
    connectionEncryption: [noise()],
    streamMuxers: [yamux()],
  };

  // Apply transport configuration
  if (transport === 'tcp') {
    config.transports = [tcp()];
  } else {
    config.transports = [webSockets()];
  }

  // Apply storage configuration
  if (storage.handler === 'file') {
    config.datastore = new FsDatastore(
      (<IStorageFileConfiguration>(<any>storage)).location,
      { createIfMissing: true }
    );
  } else {
    config.datastore = new MemoryDatastore();
  }

  const nodeP2p = await createLibp2p(config);
  // Manual patch for node bootstrap
  // IPFS bootstrap list is available here: https://docs.ipfs.tech/how-to/modify-bootstrap-list/
  // We won't care about this detail for now
  const addresses = [
    '/dnsaddr/bootstrap.libp2p.io/p2p/QmNnooDu7bfjPFoTZYxMNLWUQJyrVwtbZg5gBMjTezGAJN',
    '/dnsaddr/bootstrap.libp2p.io/p2p/QmQCU2EcMqAqQPR2i9bChDtGNJchTbq5TbXJJ16u19uLTa',
    '/dnsaddr/bootstrap.libp2p.io/p2p/QmbLHAnMoJPWSCR5Zhtx6BHJX9KiKNN6tpvbUcqanj75Nb',
    '/dnsaddr/bootstrap.libp2p.io/p2p/QmcZf59bWwK5XFi76CZX8cbJ4BhTzzA3gU1ZjYZcYW3dwt',
  ].map((e) => multiaddr(e));
  // Dial to bootstrap nodes
  for (let i = 0; i < addresses.length; i += 1) {
    await nodeP2p.dial(addresses[i]);
  }
  // Start libp2p node
  await nodeP2p.start();
  return nodeP2p;
};

/**
 * New instance of helia
 * @param libp2p libp2p instance
 * @param storage storage configuration
 * @returns helia instance
 */
const newHelia = (libp2p: Libp2p, storage: TStorageConfiguration) => {
  if (storage.handler === 'file') {
    return createHelia({
      blockstore: new FsBlockstore(
        (<IStorageFileConfiguration>(<any>storage)).location
      ),
      libp2p,
    });
  } else {
    return createHelia({
      libp2p,
    });
  }
};

/**
 * Storage engine using IPFS as backend
 * @note This is a very simple implementation of storage engine using IPFS as backend
 */
export class StorageEngineIPFS implements TIPFSFileSystem, TIPFSFileIndex {
  /**
   * Base path of the storage engine
   */
  public pathBase: string;

  /**
   * IPFS node
   */
  public nodeLibP2p: Libp2p;

  /**
   * Helia node
   */
  public nodeHelia: Helia;

  /**
   * UnixFS
   */
  public unixFs: UnixFS;

  /**
   * IPNS name system
   */
  public ipns: IPNS;

  /**
   * Collection name
   */
  collection: string = 'default';

  /**
   * Path to helia storage
   */
  get pathHelia(): string {
    return `${this.pathBase}/helia`;
  }

  /**
   * Path to nodedata
   */
  get pathNodedata(): string {
    return `${this.pathBase}/nodedata`;
  }

  /**
   * Path to storage
   */
  get pathStorage(): string {
    return `${this.pathBase}/storage`;
  }

  /**
   * Path to storage metadata
   */
  get pathStorageMetadata(): string {
    return `${this.pathBase}/storage/${METADATA_FILENAME}`;
  }

  /**
   * Path to collection
   */
  get pathCollection(): string {
    return `${this.pathStorage}/${this.collection}`;
  }

  /**
   * Path to collection metadata
   */
  get pathCollectionMetdata(): string {
    return `${this.pathStorage}/${this.collection}/${METADATA_FILENAME}`;
  }

  /**
   * Create new instance of storage engine
   * @param basePath Base path of the storage engine
   * @param config Configuration of the storage engine
   * @returns New instance of storage engine
   */
  public static async getInstance(
    basePath: string,
    config?: Partial<IIPFSConfiguration>
  ): Promise<StorageEngineIPFS> {
    StorageEngineIPFS.initPath(basePath);
    StorageEngineIPFS.initPath(`${basePath}/storage`);
    const { transport, storageP2p, storageHelia }: Partial<IIPFSConfiguration> =
      {
        transport: 'tcp',
        storageP2p: {
          handler: 'file',
          location: StorageEngineIPFS.initPath(`${basePath}/nodedata`),
        },
        storageHelia: {
          handler: 'file',
          location: StorageEngineIPFS.initPath(`${basePath}/helia`),
        },
        ...config,
      };

    const nodeLibP2p = await newLibP2p(transport, storageP2p);
    const nodeHelia = await newHelia(nodeLibP2p, storageHelia);
    const newInstance = new StorageEngineIPFS(nodeLibP2p, nodeHelia, basePath);
    return newInstance;
  }

  /**
   * Change current collection
   * @param collection Collection name
   */
  public use(collection: string): void {
    this.collection = collection;
  }

  /**
   * Initialize path
   * @param path path to be initialized
   * @returns path
   */
  private static initPath(path: string): string {
    if (!fs.existsSync(path)) {
      fs.mkdirSync(path, { recursive: true });
    }
    return path;
  }

  /**
   * Create new instance of storage engine
   * @param nodeLibp2p libp2p node
   * @param nodeHelia Helia node
   * @param path path to storage engine
   */
  constructor(nodeLibp2p: Libp2p, nodeHelia: Helia, path: string) {
    this.nodeLibP2p = nodeLibp2p;
    this.nodeHelia = nodeHelia;
    this.unixFs = unixfs(this.nodeHelia);
    this.ipns = ipns(this.nodeHelia);
    this.pathBase = path;
  }

  /**
   * Sync metadata
   * @note Please consider this is a stupid way to handle metadata.
   * Apparently, we need better mechanism to handle metadata and able to
   * update metada with lower cost, O(n) is stupid I know.
   * @param cid Content ID
   * @param filename Filename
   */
  private async syncMetadata(
    metadataFile: string,
    cid: CID,
    filename: string
  ): Promise<CID> {
    let metadataContent;
    // Read metadata file if existing
    if (fs.existsSync(metadataFile)) {
      const fileContent = fs.readFileSync(metadataFile);
      const docMetadata = BSON.deserialize(fileContent);
      docMetadata[filename] = cid.toString();
      metadataContent = BSON.serialize(docMetadata);
      fs.writeFileSync(metadataFile, metadataContent);
    } else {
      // Create new metadata file if not existing
      const docMetadata: { [key: string]: string } = {};
      docMetadata[filename] = cid.toString();
      metadataContent = BSON.serialize(docMetadata);
      fs.writeFileSync(metadataFile, metadataContent);
    }
    // Add content of metadata file to ipfs
    return this.unixFs.addBytes(metadataContent);
  }

  /**
   * Sync collection metadata
   * @param cid Content ID
   * @param filename Filename
   * @returns Content ID
   */
  private async syncCollectionMetadata(
    cid: CID,
    filename: string
  ): Promise<CID> {
    return this.syncMetadata(this.pathCollectionMetdata, cid, filename);
  }

  /**
   * Sync database metadata
   * @param cid Content ID
   * @param filename Filename
   * @returns IPNS entry
   */
  public async syncDatabaseMetadata(
    cid: CID,
    filename: string
  ): Promise<IPNSEntry> {
    // Sync collection metadata
    const collectionMetadataCID = await this.syncCollectionMetadata(
      cid,
      filename
    );
    // Sync database metadata
    const databaseMetadataCID = await this.syncMetadata(
      this.pathStorageMetadata,
      collectionMetadataCID,
      this.collection
    );
    // Publish the metadata to record
    return this.ipns.publish(this.nodeLibP2p.peerId, databaseMetadataCID);
  }

  /**
   * Write BSON data to ipfs
   * @param BSONData BSON data
   * @returns [[CID]]
   */
  writeBSON(BSONData: any): Promise<CID<unknown, number, number, Version>> {
    return this.writeBytes(BSON.serialize(BSONData));
  }

  /**
   * Write bytes to ipfs
   * @param data Bytes data
   * @returns [[CID]]
   */
  writeBytes(data: Uint8Array): Promise<CID<unknown, number, number, Version>> {
    // Write bytes to ipfs with filename is hash of data
    return this.write(Binary.toBase32(Binary.poseidonHashBinary(data)), data);
  }

  /**
   * Write data to ipfs
   * @param filename Filename
   * @param data Bytes data
   * @returns [[CID]]
   */
  async write(
    filename: string,
    data: Uint8Array
  ): Promise<CID<unknown, number, number, Version>> {
    const fullPath = `${this.pathCollection}/${filename}.zkdb`;
    StorageEngineIPFS.initPath(this.pathCollection);
    fs.writeFileSync(fullPath, data);
    const fileCID = await this.unixFs.addBytes(data);
    await this.syncDatabaseMetadata(fileCID, filename);
    return fileCID;
  }

  /**
   * Read BSON data from ipfs
   * @param filename Filename
   * @returns BSON data
   * @throws Error if file is not existing
   * @throws Error if file is not BSON data
   * @returns BSON data in bytes
   */
  async read(filename: string): Promise<Uint8Array> {
    const fullPath = `${this.pathCollection}/${filename}.zkdb`;
    if (fs.existsSync(fullPath)) {
      return fs.readFileSync(fullPath);
    } else {
      const collectionMetadata = fs.readFileSync(this.pathCollectionMetdata);
      const docMetadata = BSON.deserialize(collectionMetadata);
      if (typeof docMetadata[filename] === 'string') {
        const catIterator = this.unixFs.cat(
          Helper.toCID(docMetadata[filename])
        );
        let size = 0;
        let buf = [];
        for await (let chunk of catIterator) {
          size += chunk.length;
          buf.push(chunk);
        }
        return Binary.concatUint8Array(buf, size);
      }
      throw new Error('This document doesn not exist in the given collection');
    }
  }
  /**
   * Remove file from ipfs
   * @param filename Filename
   * @returns true if file is removed
   * @throws Error if file is not existing
   */
  async remove(filename: string): Promise<boolean> {
    // Read collection metadata
    const collectionMetadata = fs.readFileSync(this.pathCollectionMetdata);
    const docMetadata = BSON.deserialize(collectionMetadata);
    if (typeof docMetadata[filename] === 'string') {
      delete docMetadata[filename];
      const docMetadataContent = BSON.serialize(docMetadata);
      const collectionMetadataCID = await this.unixFs.addBytes(
        docMetadataContent
      );

      // Sync database metadata
      const databaseMetadataCID = await this.syncMetadata(
        this.pathStorageMetadata,
        collectionMetadataCID,
        this.collection
      );
      // Publish the metadata to record
      await this.ipns.publish(this.nodeLibP2p.peerId, databaseMetadataCID);
    }
    // Remove if file is existing on local
    const fullPath = `${this.pathCollection}/${filename}.zkdb`;
    if (fs.existsSync(fullPath)) {
      fs.rmSync(fullPath);
    }
    return true;
  }

  /**
   * Publish content ID to IPNS
   * @param contentID Content ID
   * @returns [[IPNSEntry]]
   */
  publish(
    contentID: CID<unknown, number, number, Version>
  ): Promise<IPNSEntry> {
    return this.ipns.publish(this.nodeLibP2p.peerId, contentID);
  }

  /**
   * Republish IPNS
   * @returns void
   */
  republish(): void {
    return this.ipns.republish();
  }

  /**
   * Resolve a record from IPNS
   * @param peerID Peer ID
   * @returns [[CID]]
   */
  resolve(peerID?: PeerId): Promise<CID<unknown, number, number, Version>> {
    return this.ipns.resolve(peerID ?? this.nodeLibP2p.peerId);
  }
}

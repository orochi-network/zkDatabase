import { Libp2p, Libp2pOptions, createLibp2p } from 'libp2p';
import { tcp } from '@libp2p/tcp';
import { create as kuboClient } from 'kubo-rpc-client';
import { delegatedPeerRouting } from '@libp2p/delegated-peer-routing';
import { kadDHT } from '@libp2p/kad-dht';
import { noise } from '@chainsafe/libp2p-noise';
import { MemoryDatastore } from 'datastore-core';
import { webSockets } from '@libp2p/websockets';
import { yamux } from '@chainsafe/libp2p-yamux';
import { FsDatastore } from 'datastore-fs';
import { FsBlockstore } from 'blockstore-fs';
import { createHelia } from 'helia';
import { UnixFS, UnixFSStats, unixfs } from '@helia/unixfs';
import { Helia } from '@helia/interface';
import { IPNS, ipns } from '@helia/ipns';
import { CID, Version } from 'multiformats';
import { PeerId } from '@libp2p/interface-peer-id';
import { IPNSEntry } from 'ipns';
import fs from 'fs';
import { Binary } from '../utilities/binary.js';
import { multiaddr } from '@multiformats/multiaddr';
import { StorageEngineBase } from './base.js';

export interface IIPFSDirRecord {
  name: string;
  type: 'directory' | 'raw';
  cid: CID;
  path: string;
  cotent: () => AsyncIterable<Uint8Array>;
}

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

// default is to use ipfs.io
const client = kuboClient({
  // use default api settings
  protocol: 'https',
  port: 443,
  host: 'node0.delegate.ipfs.io',
});

/**
 * New instance of libp2p
 * @param transport transport layer
 * @param storage storage configuration
 * @returns libp2p instance
 */
export const newLibP2p = async (
  transport: TTransport,
  storage: TStorageConfiguration
): Promise<Libp2p> => {
  const config: Libp2pOptions = {
    services: {
      dht: kadDHT({ allowQueryWithZeroPeers: true }),
    },
    start: true,
    addresses: {
      listen: ['/ip4/127.0.0.1/tcp/0'],
    },
    peerRouters: [delegatedPeerRouting(client)],
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

  // Start libp2p node
  const nodeP2p = await createLibp2p(config);
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

  await nodeP2p.start();
  return nodeP2p;
};

/**
 * New instance of helia
 * @param libp2p libp2p instance
 * @param storage storage configuration
 * @returns helia instance
 */
export const newHelia = (libp2p: any, storage: TStorageConfiguration) => {
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
export class StorageEngineIPFS extends StorageEngineBase<
  CID,
  UnixFSStats,
  any
> {
  /**
   * Root CID of root directory
   */
  private rootCID: CID | undefined = undefined;

  /**
   * We sure that the root CID is defined
   */
  private get definedRootCID(): CID {
    if (typeof this.rootCID !== 'undefined') {
      return this.rootCID;
    }
    throw new Error('Undefined root CID');
  }

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
   * Create new instance of storage engine
   * @param nodeLibp2p libp2p node
   * @param nodeHelia Helia node
   * @param pathBase path to storage engine
   */
  constructor(nodeLibp2p: Libp2p, nodeHelia: Helia, pathBase: string) {
    super(pathBase);
    this.nodeLibP2p = nodeLibp2p;
    this.nodeHelia = nodeHelia;
    this.unixFs = unixfs(this.nodeHelia);
    this.ipns = ipns(this.nodeHelia);
    const interval = setInterval(() => {
      if (this.nodeLibP2p.getPeers().length === 0) {
        console.log('Disconnected from IPFS network, why? why? libp2p?');
        clearInterval(interval);
      }
    }, 1000);
  }

  // Try to resolve IPNS entry to CID
  public async tryResolve() {
    this.rootCID = await this.resolve();
    if (typeof this.rootCID === 'undefined') {
      // If we can't resolve IPNS entry, try to create new one
      await this.mkdir();
    }
  }

  /**
   * Make new folder in root folder and return CID of created folder
   * @note If folder name is empty create a new root folder
   * @todo Sync metadata every time we create new folder
   * @param foldername Folder name
   * @returns
   */
  public async mkdir(foldername: string = ''): Promise<CID | undefined> {
    let cid: CID | undefined = undefined;
    if (!(await this.isFolder(foldername))) {
      if (foldername === '') {
        cid = await this.unixFs.addDirectory();
        this.rootCID = cid;
      } else {
        const localPath = `${this.pathStorage}/${foldername}`;
        if (!fs.existsSync(localPath)) {
          fs.mkdirSync(localPath, { recursive: true });
        }
        if (typeof this.rootCID === 'undefined') {
          this.rootCID = await this.unixFs.addDirectory();
        }
        cid = await this.unixFs.addDirectory();
        this.rootCID = await this.unixFs.cp(this.rootCID, cid, foldername);
      }
      await this.publish(this.rootCID);
    }
    return cid;
  }

  /**
   * Get state of given path
   * @param cid
   * @param path
   * @returns
   */
  private async stat(
    cid: CID,
    path: string = ''
  ): Promise<UnixFSStats | undefined> {
    let result;
    try {
      result = await this.unixFs.stat(cid, path === '' ? {} : { path });
    } catch (e) {
      result = undefined;
    }
    return result;
  }

  /**
   * Check stat of a path
   * @param path
   * @returns
   */
  public async check(path: string = '') {
    return this.unixFs.stat(this.definedRootCID, path === '' ? {} : { path });
  }

  /**
   * Is path is a file
   * @param path
   * @returns Promise<boolean>
   */
  public async isFile(path: string = ''): Promise<boolean> {
    if (typeof this.rootCID !== 'undefined') {
      const stat = await this.stat(this.rootCID, path);
      return typeof stat !== 'undefined' ? stat.type === 'raw' : false;
    }
    return false;
  }

  /**
   * Is path is a folder
   * @param path
   * @returns Promise<boolean>
   */
  public async isFolder(path: string = ''): Promise<boolean> {
    if (typeof this.rootCID !== 'undefined') {
      const stat = await this.stat(this.rootCID, path);
      return typeof stat !== 'undefined' ? stat.type === 'directory' : false;
    }
    return false;
  }

  /**
   * Check the existence of given path
   * @param path
   * @returns Promise<boolean>
   */
  public async isExist(path: string = ''): Promise<boolean> {
    if (typeof this.rootCID !== 'undefined') {
      const stat = await this.stat(this.rootCID, path);
      return typeof stat !== 'undefined';
    }
    return false;
  }

  /**
   * List all files and folders in given path
   * @param path Given path
   */
  public async ls(path: string = '') {
    if (await this.isExist(path)) {
      const result = [];
      for await (const entry of this.unixFs.ls(
        this.definedRootCID,
        path === '' ? {} : { path }
      )) {
        result.push({
          name: entry.name,
          type: entry.type,
          cid: entry.cid,
          path: entry.path,
          cotent: entry.content,
        });
      }
      return result;
    }
    throw new Error('Given path is not exist');
  }

  /**
   * Write the metadata file at the root folder
   * @param filename
   * @param content
   * @returns
   */
  public async writeMetadataFile(
    filename: string,
    content: Uint8Array
  ): Promise<CID> {
    // Add file to IPFS and get CID
    const fileCID = await this.unixFs.addBytes(content);
    // Make the root folder if not exist
    if (!(await this.isFolder())) {
      await this.mkdir();
    }
    // Check for the existance of root folder
    if (await this.isFolder()) {
      if (await this.isFile(filename)) {
        await this.unixFs.rm(this.definedRootCID, filename);
      }
      this.rootCID = await this.unixFs.cp(
        fileCID,
        this.definedRootCID,
        filename
      );
      await this.publish(this.rootCID);
      return fileCID;
    }
    throw new Error('Root path is not exist and we can not create it');
  }

  /**
   * @todo Update CID record of collection in metadata file
   * every time we write something
   * @param filename
   * @param content
   * @returns
   */
  public async writeFile(filename: string, content: Uint8Array) {
    // Add file to IPFS and get CID
    const fileCID = await this.unixFs.addBytes(content);
    // Make the root folder if not exist
    if (!(await this.isFolder())) {
      await this.mkdir();
    }
    // Check for the existance of root folder
    if (await this.isFolder()) {
      // Get stat of collection folder
      const collectionFolder = await this.stat(
        this.definedRootCID,
        this.collection
      );
      let collectionFolderCID =
        typeof collectionFolder === 'undefined'
          ? await this.unixFs.addDirectory()
          : collectionFolder.cid;
      if (typeof collectionFolder !== 'undefined') {
        // Remove file from collection folder if exist
        if (await this.isFile(`${this.collection}/${filename}`)) {
          // Remove file from collection folder
          collectionFolderCID = await this.unixFs.rm(
            collectionFolderCID,
            filename
          );
        }
        // Remove collection folder from the root folder
        this.rootCID = await this.unixFs.rm(
          this.definedRootCID,
          this.collection
        );
      }
      // Add file to collection folder
      collectionFolderCID = await this.unixFs.cp(
        fileCID,
        collectionFolderCID,
        filename
      );
      // Add collection folder to root folder
      this.rootCID = await this.unixFs.cp(
        collectionFolderCID,
        this.definedRootCID,
        this.collection
      );
      await this.publish(this.definedRootCID);
      return fileCID;
    }
    throw new Error('Root folder is not exist and we can not create it');
  }

  /**
   * Remove file from ipfs
   * @param filename Filename
   * @returns true if file is removed
   * @throws Error if file is not existing
   */
  public async delete(path: string): Promise<boolean> {
    // Make sure root folder is exist
    if (await this.isExist()) {
      // Make sure file is exist
      if (await this.isFile(path)) {
        const pathParts = path.split('/');
        if (pathParts.length === 2) {
          const [collection, finename] = pathParts;
          // Find collection folder
          const collectionFolder = await this.stat(
            this.definedRootCID,
            collection
          );
          if (typeof collectionFolder !== 'undefined') {
            // Remove file from collection folder
            collectionFolder.cid = await this.unixFs.rm(
              collectionFolder.cid,
              finename
            );
            // Add collection folder to root folder
            this.rootCID = await this.unixFs.cp(
              collectionFolder.cid,
              this.definedRootCID,
              collection
            );
          } else {
            return false;
          }
        } else if (pathParts.length === 1) {
          this.rootCID = await this.unixFs.rm(this.definedRootCID, path);
        } else {
          return false;
        }
        await this.publish(this.rootCID);
        return true;
      }
      // Since there is one level of folder, we can remove the folder
      if (!path.includes('/') && (await this.isFolder(path))) {
        this.rootCID = await this.unixFs.rm(this.definedRootCID, path);
        await this.publish(this.rootCID);
        return true;
      }
    }
    return false;
  }

  /**
   * Read a file from ipfs
   * @param path
   * @returns
   */
  public async readFile(path: string): Promise<Uint8Array> {
    if (await this.isFile(path)) {
      let size = 0;
      let buf = [];
      for await (let chunk of this.unixFs.cat(this.definedRootCID, { path })) {
        size += chunk.length;
        buf.push(chunk);
      }
      return Binary.concatUint8Array(buf, size);
    }
    throw new Error('The give path is not a file');
  }

  /**
   * Publish content ID to IPNS
   * @param contentID Content ID
   * @returns [[IPNSEntry]]
   */
  public publish(
    contentID: CID<unknown, number, number, Version>
  ): Promise<IPNSEntry> {
    return this.ipns.publish(this.nodeLibP2p.peerId, contentID);
  }

  /**
   * Republish IPNS
   * @returns void
   */
  public republish(): void {
    return this.ipns.republish();
  }

  /**
   * Resolve a record from IPNS
   * @param peerID Peer ID
   * @returns [[CID]]
   */
  public async resolve(
    peerID?: PeerId
  ): Promise<CID<unknown, number, number, Version> | undefined> {
    try {
      const result = await this.ipns.resolve(peerID ?? this.nodeLibP2p.peerId);
      return result;
    } catch (e) {
      return undefined;
    }
  }

  /**
   * Shutdown the serivce
   */
  public async shutodnw() {
    await this.nodeHelia.stop();
    await this.nodeLibP2p.stop();
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
    await newInstance.tryResolve();
    return newInstance;
  }
}

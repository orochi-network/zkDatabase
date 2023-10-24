import { FsDatastore } from 'datastore-fs';
import { FsBlockstore } from 'blockstore-fs';
import { createHelia } from 'helia';
import { UnixFS, UnixFSStats, unixfs } from '@helia/unixfs';
import { Helia } from '@helia/interface';
import { IPNS, ipns } from '@helia/ipns';
import { CID, Version } from 'multiformats';
import { PeerId } from '@libp2p/interface-peer-id';
import { IPNSEntry } from 'ipns';
import { Binary } from '../utilities/binary.js';
import { StorageEngineBase } from './base.js';
import { IIPFSDirRecord, THeliaConfig } from '../core/common.js';
import { Readable, Writable } from 'stream';
import { ReadStream } from 'fs';

/**
 * Metadata filename
 */
export const METADATA_FILENAME = 'metadata';

/**
 * Storage engine using IPFS as backend
 * @note This is a very simple implementation of storage engine using IPFS as backend
 */
export class StorageEngineIPFS extends StorageEngineBase<
  CID,
  UnixFSStats,
  IIPFSDirRecord
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
   * Create new instance of storage engine
   * @param nodeHelia Helia node
   */
  constructor(nodeHelia: Helia) {
    super('/');
    this.nodeHelia = nodeHelia;
    this.unixFs = unixfs(this.nodeHelia);
    this.ipns = ipns(this.nodeHelia);
    console.log(
      'Your node has been successfully initialized and is listening at the following addresses:'
    );
    this.nodeHelia.libp2p
      .getMultiaddrs()
      .forEach((address) => console.log(address.toString()));
  }

  // Try to resolve IPNS entry to CID
  public async tryResolve() {
    this.rootCID = await this.resolve();
    if (typeof this.rootCID === 'undefined') {
      console.log('Unable to resolve rootCID, create a new one');
      // If we can't resolve IPNS entry, try to create new one
      await this.mkdir();
    } else {
      console.log('Resolve the rootCID:', this.rootCID.toString());
    }
  }

  /**
   * Make new folder in root folder and return CID of created folder
   * @note If folder name is empty create a new root folder
   * @todo Sync metadata every time we create new folder
   * @param path Folder name
   * @returns
   */
  public async mkdir(path: string = ''): Promise<CID | undefined> {
    if (path.split('/').length >= 3) {
      throw new Error('Path is too deep');
    }
    let cid: CID | undefined = undefined;
    if (!(await this.isFolder(path))) {
      if (path === '') {
        console.log('Create new root folder');
        this.rootCID = await this.unixFs.addDirectory();
      } else {
        const { basename } = this.splitPath(path);
        if (basename === '') {
          throw new Error('Basename can not be empty');
        }
        if (typeof this.rootCID === 'undefined') {
          this.rootCID = await this.unixFs.addDirectory();
        }
        cid = await this.unixFs.addDirectory();
        this.rootCID = await this.unixFs.cp(this.rootCID, cid, basename);
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
    return this.stat(this.definedRootCID, path);
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
  public async ls(path: string = ''): Promise<IIPFSDirRecord[]> {
    if (await this.isExist(path)) {
      const result: IIPFSDirRecord[] = [];
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
        this.rootCID = await this.unixFs.rm(this.definedRootCID, filename);
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
   * @param path
   * @param content
   * @returns
   */
  public async writeFile(path: string, content: Uint8Array): Promise<CID> {
    if (typeof this.rootCID === 'undefined') {
      throw new Error('Root CID is undefined');
    }
    // Add file to IPFS and get CID
    const fileCID = await this.unixFs.addBytes(content);
    const { parentPath, parentDir, basename } = this.splitPath(path);

    // Check for the existance of root folder
    if (!(await this.isFolder(parentPath))) {
      this.mkdir(parentDir);
    }

    // Get stat of collection folder
    const parentFolderStat = await this.stat(this.definedRootCID, parentPath);
    let parentCID;
    if (typeof parentFolderStat !== 'undefined') {
      parentCID = parentFolderStat.cid;
      // Remove file from collection folder if exist
      if (await this.isExist(path)) {
        // Remove file from collection folder
        parentCID = await this.unixFs.rm(parentCID, basename);
      }
      this.rootCID = await this.unixFs.rm(this.definedRootCID, parentDir);
    } else {
      parentCID = await this.unixFs.addDirectory();
    }

    // Add file to parent folder
    parentCID = await this.unixFs.cp(fileCID, parentCID, basename);
    // Add parent folder to root folder
    this.rootCID = await this.unixFs.cp(
      parentCID,
      this.definedRootCID,
      parentDir
    );
    await this.publish(this.definedRootCID);
    return fileCID;
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

  public createReadStream(_path: string): Readable {
    throw Error("Not Implemented");
  }

  public createWriteStream(_path: string): Writable {
    throw Error("Not Implemented");
  }

  public streamWriteFile(_path: string, _contentStream: ReadStream): Promise<string> {
    throw Error("Not Implemented");
  }

  /**
   * Publish content ID to IPNS
   * @param contentID Content ID
   * @returns [[IPNSEntry]]
   */
  public publish(
    contentID: CID<unknown, number, number, Version>
  ): Promise<IPNSEntry> {
    return this.ipns.publish(this.nodeHelia.libp2p.peerId, contentID);
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
      const result = await this.ipns.resolve(
        peerID ?? this.nodeHelia.libp2p.peerId
      );
      return result;
    } catch (e) {
      return undefined;
    }
  }

  /**
   * Shutdown the serivce
   */
  public async shutdown() {
    await this.nodeHelia.stop();
  }

  /**
   * Create new instance of storage engine
   * @param basePath Base path of the storage engine
   * @param config Configuration of the storage engine
   * @returns New instance of storage engine
   */
  public static async getInstance(
    config: THeliaConfig
  ): Promise<StorageEngineIPFS> {
    let nodeHelia;
    if (config.handler === 'file') {
      const dataStorePath = `${config.location}/datastore`;
      const blockStorePath = `${config.location}/blockstore`;

      StorageEngineIPFS.initPath(dataStorePath);
      StorageEngineIPFS.initPath(blockStorePath);
      nodeHelia = await createHelia({
        datastore: new FsDatastore(dataStorePath),
        blockstore: new FsBlockstore(blockStorePath),
      });
    } else {
      nodeHelia = await createHelia();
    }
    const newInstance = new StorageEngineIPFS(nodeHelia as any as Helia);
    await newInstance.tryResolve();
    return newInstance;
  }
}

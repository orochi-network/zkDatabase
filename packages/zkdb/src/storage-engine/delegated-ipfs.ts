import { KuboClient, TFilesLsEntry, TFilesStatEntry } from '@zkdb/kubo';
import { StorageEngineBase } from './base.js';
import { TDelegatedIPFSConfig } from '../core/common.js';
import { Readable, Writable } from 'stream';

/**
 * Storage engine using IPFS as backend
 * @note This is a very simple implementation of storage engine using IPFS as backend
 */
export class StorageEngineDelegatedIPFS extends StorageEngineBase<
  string,
  TFilesStatEntry,
  TFilesLsEntry
> {
  private kuboClient: KuboClient;

  /**
   * Create new instance of storage engine
   * @param nodeLibp2p libp2p node
   */
  constructor(pathBase: string, kuboClient: KuboClient) {
    super(pathBase);
    this.kuboClient = kuboClient;
  }

  /**
   * Make new folder in root folder and return CID of created folder
   * @note If folder name is empty create a new root folder
   * @todo Sync metadata every time we create new folder
   * @param foldername Folder name
   * @returns
   */
  public async mkdir(foldername: string = ''): Promise<string | undefined> {
    const path = `${this.pathBase}/${foldername}`;
    await this.kuboClient.filesMkdir({ arg: path, parents: true });
    return path;
  }

  /**
   * Check stat of a path
   * @param path
   * @returns
   */
  public async check(path: string = ''): Promise<TFilesStatEntry | undefined> {
    try {
      const result = await this.kuboClient.filesStat({
        arg: `${this.pathBase}/${path}`,
      });
      return result;
    } catch (e) {
      return undefined;
    }
  }

  /**
   * Is path is a file
   * @param path
   * @returns Promise<boolean>
   */
  public async isFile(path: string = ''): Promise<boolean> {
    return this.kuboClient.existFile(`${this.pathBase}/${path}`);
  }

  /**
   * Is path is a folder
   * @param path
   * @returns Promise<boolean>
   */
  public async isFolder(path: string = ''): Promise<boolean> {
    return this.kuboClient.existDir(`${this.pathBase}/${path}`);
  }

  /**
   * Check the existence of given path
   * @param path
   * @returns Promise<boolean>
   */
  public async isExist(path: string = ''): Promise<boolean> {
    return this.kuboClient.exist(`${this.pathBase}/${path}`);
  }

  /**
   * List all files and folders in given path
   * @param path Given path
   */
  public async ls(path: string = ''): Promise<TFilesLsEntry[]> {
    return this.kuboClient.filesLs({ path: `${this.pathBase}/${path}` });
  }

  /**
   * @todo Update CID record of collection in metadata file
   * every time we write something
   * @param path
   * @param content
   * @returns
   */
  public async writeFile(path: string, content: Uint8Array): Promise<string> {
    const filePath = `${this.pathBase}/${path}`;
    if (await this.kuboClient.exist(filePath)) {
      await this.kuboClient.filesRm({
        arg: filePath,
        recursive: true,
        force: true,
      });
    }
    await this.kuboClient.filesWrite(filePath, content);
    return filePath;
  }

  /**
   * Remove file from ipfs
   * @param filename Filename
   * @returns true if file is removed
   * @throws Error if file is not existing
   */
  public async delete(path: string): Promise<boolean> {
    await this.kuboClient.filesRm({
      arg: `${this.pathBase}/${path}`,
      recursive: true,
      force: true,
    });
    return true;
  }

  // TODO: Must be implemented
  public async cleanUp(): Promise<boolean> {
    throw Error('Not Implemented');
  }

  /**
   * Read a file from ipfs
   * @param path
   * @returns
   */
  public async readFile(path: string): Promise<Uint8Array> {
    return new Uint8Array(
      await this.kuboClient.filesRead({ arg: `${this.pathBase}/${path}` })
    );
  }

  public createReadStream(_path: string): Readable {
    throw Error("Not Implemented");
  }

  public createWriteStream(_path: string): Writable {
    throw Error("Not Implemented");
  }

  public streamWriteFile(_path: string, _contentStream: Readable): Promise<string> {
    throw Error("Not Implemented");
  }

  /**
   * Create new instance of storage engine
   * @param basePath Base path of the storage engine
   * @param config Configuration of the storage engine
   * @returns New instance of storage engine
   */
  public static async getInstance(
    config: TDelegatedIPFSConfig
  ): Promise<StorageEngineDelegatedIPFS> {
    const kuboClient = new KuboClient(config.kubo);
    const basePath = `/${config.database}`;
    await kuboClient.filesMkdir({ arg: basePath, parents: true });
    return new StorageEngineDelegatedIPFS(basePath, kuboClient);
  }
}

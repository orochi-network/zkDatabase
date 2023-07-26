import fs from 'fs';
import { StorageEngineBase } from './base.js';

export interface IDirRecord {
  name: string;
  type: string;
  path: string;
}

/**
 * Storage engine using IPFS as backend
 * @note This is a very simple implementation of storage engine using IPFS as backend
 */
export class StorageEngineLocal extends StorageEngineBase<
  string,
  fs.Stats,
  IDirRecord
> {
  /**
   * Create new instance of storage engine
   * @param nodeLibp2p libp2p node
   */
  constructor(pathBase: string) {
    super(pathBase);
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
    fs.mkdirSync(path, { recursive: true });
    return path;
  }

  /**
   * Check stat of a path
   * @param path
   * @returns
   */
  public async check(path: string = ''): Promise<fs.Stats | undefined> {
    try {
      return fs.statSync(`${this.pathBase}/${path}`);
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
    try {
      const stat = fs.statSync(`${this.pathBase}/${path}`);
      return stat.isFile();
    } catch (e) {
      return false;
    }
  }

  /**
   * Is path is a folder
   * @param path
   * @returns Promise<boolean>
   */
  public async isFolder(path: string = ''): Promise<boolean> {
    try {
      const stat = fs.statSync(`${this.pathBase}/${path}`);
      return stat.isDirectory();
    } catch {
      return false;
    }
  }

  /**
   * Check the existence of given path
   * @param path
   * @returns Promise<boolean>
   */
  public async isExist(path: string = ''): Promise<boolean> {
    return fs.existsSync(`${this.pathBase}/${path}`);
  }

  /**
   * List all files and folders in given path
   * @param path Given path
   */
  public async ls(path: string = ''): Promise<IDirRecord[]> {
    if (await this.isExist(path)) {
      const result = [];
      for await (const entry of fs.opendirSync(`${this.pathBase}/${path}`)) {
        result.push({
          name: entry.name,
          type: entry.isDirectory() ? 'directory' : 'file',
          path: entry.path,
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
  ): Promise<string> {
    const filepath = `${this.pathBase}/${filename}`;
    fs.writeFileSync(filepath, content);
    return filepath;
  }

  /**
   * @todo Update CID record of collection in metadata file
   * every time we write something
   * @param filename
   * @param content
   * @returns
   */
  public async writeFile(filename: string, content: Uint8Array) {
    const filepath = `${this.pathBase}/${this.collection}/${filename}`;
    if (!(await this.isFolder(`${this.pathBase}/${this.collection}`))) {
      this.mkdir(`${this.collection}`);
    }
    fs.writeFileSync(filepath, content);
    return filepath;
  }

  /**
   * Remove file from ipfs
   * @param filename Filename
   * @returns true if file is removed
   * @throws Error if file is not existing
   */
  public async delete(path: string): Promise<boolean> {
    fs.unlinkSync(`${this.pathBase}/${path}`);
    return true;
  }

  /**
   * Read a file from ipfs
   * @param path
   * @returns
   */
  public async readFile(path: string): Promise<Uint8Array> {
    return fs.readFileSync(`${this.pathBase}/${path}`);
  }

  /**
   * Create new instance of storage engine
   * @param basePath Base path of the storage engine
   * @param config Configuration of the storage engine
   * @returns New instance of storage engine
   */
  public static async getInstance(
    basePath: string
  ): Promise<StorageEngineLocal> {
    StorageEngineBase.initPath(basePath);

    return new StorageEngineLocal(basePath);
  }
}

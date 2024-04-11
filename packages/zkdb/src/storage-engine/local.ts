import fs from 'fs';
import * as path from 'path';
import { StorageEngineBase } from './base.js';
import { TLocalConfig } from '../core/common.js';
import { Readable, Writable } from 'stream';

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
    const fullPath = path.join(this.pathBase, foldername);
    fs.mkdirSync(fullPath, { recursive: true });
    return fullPath;
  }

  /**
   * Check stat of a path
   * @param pafilePathth
   * @returns
   */
  public async check(filePath: string = ''): Promise<fs.Stats | undefined> {
    try {
      return fs.statSync(path.join(this.pathBase, filePath));
    } catch (e) {
      return undefined;
    }
  }

  /**
   * Is path is a file
   * @param filePath
   * @returns Promise<boolean>
   */
  public async isFile(filePath: string = ''): Promise<boolean> {
    if (!this.isExist(filePath)) {
      return false;
    }
    const fullPath = path.join(this.pathBase, filePath);
    try {
      const stat = fs.statSync(fullPath);
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
  public async isFolder(folderPath: string = ''): Promise<boolean> {
    try {
      const stat = fs.statSync(path.join(this.pathBase, folderPath));
      return stat.isDirectory();
    } catch {
      return false;
    }
  }

  /**
   * Check the existence of given path
   * @param filePath
   * @returns Promise<boolean>
   */
  public async isExist(filePath: string = ''): Promise<boolean> {
    return fs.existsSync(path.join(this.pathBase, filePath));
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
   * @todo Update CID record of collection in metadata file
   * every time we write something
   * @param path
   * @param content
   * @returns
   */
  public async writeFile(filePath: string, content: Uint8Array) {
    const filepath = path.join(this.pathBase, filePath);
    const pathParts = filepath.split('/');
    pathParts.pop();
    const currentPath = pathParts.join('/');
    if (!(await this.isFolder(currentPath))) {
      fs.mkdirSync(currentPath, { recursive: true });
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
  public async delete(filePath: string): Promise<boolean> {
    fs.unlinkSync(path.join(this.pathBase, filePath));
    return true;
  }

  /**
   * Read a file from ipfs
   * @param path
   * @returns
   */
  public async readFile(filePath: string): Promise<Uint8Array> {
    return fs.readFileSync(path.join(this.pathBase, filePath));
  }

  public createReadStream(filePath: string): Readable {
    return fs.createReadStream(path.join(this.pathBase, filePath));
  }

  public createWriteStream(filePath: string): Writable {
    return fs.createWriteStream(path.join(this.pathBase, filePath), {
      flags: 'w',
    });
  }

  /**
   * Create new instance of storage engine
   * @param config Configuration of the storage engine
   * @returns New instance of storage engine
   */
  public static async getInstance(
    config: TLocalConfig
  ): Promise<StorageEngineLocal> {
    StorageEngineBase.initPath(config.location);
    return new StorageEngineLocal(config.location);
  }
}

import fs from 'fs';
import { Readable, Writable } from 'stream';

/**
 * Storage engine using IPFS as backend
 * @note This is a very simple implementation of storage engine using IPFS as backend
 */
export abstract class StorageEngineBase<T, K, M> {
  /**
   * Base path of the storage engine
   */
  public pathBase: string;

  /**
   * Create new instance of storage engine
   * @param pathBase path to storage engine
   */
  constructor(pathBase: string) {
    this.pathBase = pathBase;
  }

  /**
   * Split path to components
   * @param path
   * @returns
   */
  protected splitPath(path: string) {
    let parentPath = '';
    let parentDir = '';
    let basename = '';
    const pathParts = path.split('/');
    if (pathParts.length >= 2) {
      basename = pathParts.pop()!;
      parentDir = pathParts.pop()!;
      pathParts.push(parentDir);
      parentPath = parentDir === '' ? '/' : pathParts.join('/');
    } else {
      basename = pathParts.length === 1 ? pathParts[0] : path;
    }
    return {
      parentPath,
      parentDir,
      basename,
    };
  }

  /**
   * Make new folder in root folder and return CID of created folder
   * @note If folder name is empty create a new root folder
   * @todo Sync metadata every time we create new folder
   * @param path Path to the folder
   * @returns
   */
  public abstract mkdir(_path: string): Promise<T | undefined>;

  /**
   * Check stat of a path
   * @param path
   * @returns
   */
  public abstract check(_path: string): Promise<K | undefined>;

  /**
   * Is path is a file
   * @param path
   * @returns Promise<boolean>
   */
  public abstract isFile(_path: string): Promise<boolean>;

  /**
   * Is path is a folder
   * @param path
   * @returns Promise<boolean>
   */
  public abstract isFolder(_path: string): Promise<boolean>;

  /**
   * Check the existence of given path
   * @param path
   * @returns Promise<boolean>
   */
  public abstract isExist(_path: string): Promise<boolean>;
  /**
   * List all files and folders in given path
   * @param path Given path
   */
  public abstract ls(_path: string): Promise<M[]>;

  /**
   * @todo Update CID record of collection in metadata file
   * every time we write something
   * @param path
   * @param content
   * @returns
   */
  public abstract writeFile(_path: string, _content: Uint8Array): Promise<T>;

  /**
   * Remove file from ipfs
   * @param filename Filename
   * @returns true if file is removed
   * @throws Error if file is not existing
   */
  public abstract delete(_path: string): Promise<boolean>;
  /**
   * Read a file from ipfs
   * @param path
   * @returns
   */
  public abstract readFile(_path: string): Promise<Uint8Array>;

  /**
   * Stream file from the file system
   * @param path
   * @returns
   */
  public abstract createReadStream(_path: string): Readable;

  /**
   * Stream content to a file in the file system
   * @param path
   * @param content
   */
  public abstract createWriteStream(_path: string): Writable;

  /**
   * Initialize path
   * @param path path to be initialized
   * @returns path
   */
  protected static initPath(path: string): string {
    if (!fs.existsSync(path)) {
      fs.mkdirSync(path, { recursive: true });
    }
    return path;
  }
}

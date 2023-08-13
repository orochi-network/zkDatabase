import fs from 'fs';

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
   * Collection name
   */
  collection: string = 'default';

  /**
   * Create new instance of storage engine
   * @param pathBase path to storage engine
   */
  constructor(pathBase: string) {
    this.pathBase = pathBase;
  }

  /**
   * Make new folder in root folder and return CID of created folder
   * @note If folder name is empty create a new root folder
   * @todo Sync metadata every time we create new folder
   * @param foldername Folder name
   * @returns
   */
  public abstract mkdir(_foldername: string): Promise<T | undefined>;

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
  protected static initPath(path: string): string {
    if (!fs.existsSync(path)) {
      fs.mkdirSync(path, { recursive: true });
    }
    return path;
  }
}

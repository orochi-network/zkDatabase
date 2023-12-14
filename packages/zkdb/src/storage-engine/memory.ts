import { Readable, Writable } from 'stream';
import { StorageEngineBase } from './base.js';

/**
 * Storage engine using IPFS as backend
 * @note This is a very simple implementation of storage engine using IPFS as backend
 */
export class StorageEngineMemory extends StorageEngineBase<string, any, any> {
  private innerData = new Map<string, Uint8Array>();

  /**
   * Create new instance of storage engine
   * @param basePath string Base path of the storage engine
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
    return `${this.pathBase}/${foldername}`;
  }

  /**
   * Check stat of a path
   * @param path
   * @returns
   */
  public async check(_path: string = ''): Promise<{} | undefined> {
    return {};
  }

  /**
   * Is path is a file
   * @param path
   * @returns Promise<boolean>
   */
  public async isFile(path: string = ''): Promise<boolean> {
    const filepath = `${this.pathBase}/${path}`;
    return this.innerData.has(filepath);
  }

  /**
   * Is path is a folder
   * @param path
   * @returns Promise<boolean>
   */
  public async isFolder(_path: string = ''): Promise<boolean> {
    return true;
  }

  /**
   * Check the existence of given path
   * @param path
   * @returns Promise<boolean>
   */
  public async isExist(_path: string = ''): Promise<boolean> {
    return true;
  }

  /**
   * List all files and folders in given path
   * @param path Given path
   */
  public async ls(_path: string = ''): Promise<any> {
    throw new Error('Given path is not exist');
  }

  /**
   * @todo Update CID record of collection in metadata file
   * every time we write something
   * @param path
   * @param content
   * @returns
   */
  public async writeFile(path: string, content: Uint8Array) {
    const filepath = `${this.pathBase}/${path}`;
    this.innerData.set(filepath, content);
    return filepath;
  }

  /**
   * Remove file from ipfs
   * @param filename Filename
   * @returns true if file is removed
   * @throws Error if file is not existing
   */
  public async delete(path: string): Promise<boolean> {
    this.innerData.delete(`${this.pathBase}/${path}`);
    return true;
  }

  /**
   * Read a file from ipfs
   * @param path
   * @returns
   */
  public async readFile(path: string): Promise<Uint8Array> {
    return this.innerData.get(`${this.pathBase}/${path}`)!;
  }

  public createWriteStream(path: string): Writable {
    const filepath = `${this.pathBase}/${path}`;
    const innerData = this.innerData;
    let data: Buffer[] = [];
  
    const writableStream = new Writable({
      write(chunk, encoding, callback) {
        data.push(chunk);
        callback();
      },
      final(callback) {
        const content = Buffer.concat(data);
        innerData.set(filepath, content);
        callback();
      }
    });
  
    return writableStream;
  }

  public createReadStream(path: string): Readable {
    const filepath = `${this.pathBase}/${path}`;
    const innerData = this.innerData;
    let sent = false;
  
    const readableStream = new Readable({
      read(_) {
        if (!sent) {
          const data = innerData.get(filepath);
          if (data) {
            this.push(data);
          }
          sent = true;
        }
        this.push(null);
      }
    });
  
    return readableStream;
  }

  /**
   * Create new instance of storage engine
   * @param config Configuration of the storage engine
   * @returns New instance of storage engine
   */
  public static async getInstance(): Promise<StorageEngineMemory> {
    return new StorageEngineMemory('data/');
  }
}

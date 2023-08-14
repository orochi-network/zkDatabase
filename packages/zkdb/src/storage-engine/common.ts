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

import { BSON } from 'bson';
import DistributedMerkleTree from 'merkle-tree/merkle-tree-ipfs.js';
import { CID } from 'multiformats';
import { IKeyValue } from 'core/common.js';
import { SimpleIndexer } from 'index/simple.js';
import { StorageEngineIPFS } from './ipfs.js';

export interface ICollection {
  [key: string]: CID;
}

export interface ICollectionJSON {
  [key: string]: string;
}

export const FILENAME_METADATA = 'metadata.bson';

export const FILENAME_INDEX = 'index.bson';

export const FILENAME_MERKLE = 'merkle.bson';

export class MetadataCollection {
  private collections: ICollection;

  constructor(collections: ICollection) {
    // Clone the object instead
    this.collections = { ...collections };
  }

  public update(collectionName: string, cid: CID) {
    this.collections[collectionName] = cid;
  }

  public remove(collectionName: string) {
    delete this.collections[collectionName];
  }

  public toJSON(): ICollectionJSON {
    // Tranform { [key: string]: CID } to { [key: string]: string }
    return Object.fromEntries(
      Object.entries(this.collections).map(([key, value]) => [
        key,
        value.toString(),
      ])
    );
  }

  public toBSON(): Uint8Array {
    // Tranform { [key: string]: CID } to { [key: string]: string }
    return BSON.serialize(
      Object.fromEntries(
        Object.entries(this.collections).map(([key, value]) => [
          key,
          value.toString(),
        ])
      )
    );
  }

  public static fromBSON(BSONInBytes: Uint8Array) {
    const collections = <ICollection>(
      Object.fromEntries(
        Object.entries(<IKeyValue>BSON.deserialize(BSONInBytes)).map(
          ([key, value]) => [key, CID.parse(value.toString())]
        )
      )
    );
    return new MetadataCollection(collections);
  }
}

export class Metadata {
  public collection: MetadataCollection;
  public indexer: SimpleIndexer;
  public merkle: DistributedMerkleTree;
  public ipfs: StorageEngineIPFS;

  constructor(
    ipfs: StorageEngineIPFS,
    collection: MetadataCollection,
    indexer: SimpleIndexer,
    merkleTree: DistributedMerkleTree
  ) {
    this.collection = collection;
    this.indexer = indexer;
    this.merkle = merkleTree;
  }

  public static async load(
    ipfs: StorageEngineIPFS,
    defaultHeight: number = 64
  ) {
    if (await ipfs.isExist()) {
      // Load collection metadata
      const collection = (await ipfs.isFile(FILENAME_METADATA))
        ? MetadataCollection.fromBSON(await ipfs.readFile(FILENAME_METADATA))
        : new MetadataCollection({});

      // Load indexer
      const indexer = (await ipfs.isFile(FILENAME_INDEX))
        ? SimpleIndexer.fromBSON(await ipfs.readFile(FILENAME_INDEX))
        : new SimpleIndexer([]);

      // Load merkle tree
      const merkleTree = await DistributedMerkleTree.load(ipfs, defaultHeight);

      // Return instance of Metadata
      return new Metadata(ipfs, collection, indexer, merkleTree);
    }

    throw new Error(
      'Broken IPFS Storage Engine, root folder not found or data corrupted'
    );
  }
}

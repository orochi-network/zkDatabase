import { MongoClient, ObjectId } from 'mongodb';
import { StorageEngineBase } from './base.js';
import { TMongoDbConfig } from '../core/common.js';
import { Readable, Writable } from 'stream';

export class StorageEngineMongoDB extends StorageEngineBase<string, any, any> {
  private client: MongoClient;

  constructor(dbName: string, client: MongoClient) {
    super(dbName);
    this.client = client;
  }

  public async mkdir(_path: string): Promise<string | undefined> {
    return (await this.client.db(this.location).createCollection(_path))
      .collectionName;
  }

  public async ispectPath(_path: string): Promise<any> {
    const path = this.splitPath(_path);

    await this.client.db(this.location).command({ collStats: path.basename });
  }

  public async isFile(_path: string): Promise<boolean> {
    const path = this.splitPath(_path);

    const document = await this.client
      .db(this.location)
      .collection(path.parentDir)
      .findOne({ path: path.basename });
    return document != null;
  }

  public async isFolder(_path: string): Promise<boolean> {
    const path = this.splitPath(_path);

    const collections = await this.client
      .db(this.location)
      .listCollections()
      .toArray();
    return collections.some((collection) => collection.name === path.basename);
  }

  public async isExist(_path: string): Promise<boolean> {
    return true;
  }

  public ls(_path: string): Promise<any[]> {
    return this.client.db(this.location).collection(_path).find().toArray();
  }

  public async writeFile(_path: string, _content: Uint8Array): Promise<string> {
    const path = this.splitPath(_path);

    const objectId = new ObjectId(path.basename);

    const collection = this.client.db(this.location).collection(path.parentDir);
    const document = { _id: _path, content: _content };
    const result = await collection.updateOne(
      { _id: objectId },
      { $set: document },
      { upsert: true }
    );
    return result.upsertedId ? result.upsertedId.toString() : path.basename;
  }

  public async delete(_path: string): Promise<boolean> {
    const path = this.splitPath(_path);

    const objectId = new ObjectId(path.basename);

    const collection = this.client
      .db(this.location)
      .collection(path.parentPath);
    const result = await collection.deleteOne({ _id: objectId });
    return result.deletedCount > 0;
  }

  public async readFile(_path: string): Promise<Uint8Array> {
    const path = this.splitPath(_path);

    const objectId = new ObjectId(path.basename);

    const collection = this.client
      .db(this.location)
      .collection('yourFilesCollection');
    const doc = await collection.findOne({ _id: objectId });
    if (!doc) {
      throw new Error('Document not found');
    }
    return new Uint8Array(doc.content.buffer);
  }

  public createReadStream(_path: string): Readable {
    throw new Error('Method not implemented.');
  }

  public createWriteStream(_path: string): Writable {
    throw new Error('Method not implemented.');
  }

  public static async getInstance(
    config: TMongoDbConfig
  ): Promise<StorageEngineMongoDB> {
    const client = new MongoClient(config.url);
    await client.connect();
    return new StorageEngineMongoDB(config.dbName, client);
  }
}

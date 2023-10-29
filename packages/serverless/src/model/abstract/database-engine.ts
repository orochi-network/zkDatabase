import {
  ClientSession,
  Collection,
  CreateIndexesOptions,
  Db,
  Filter,
  IndexSpecification,
  InsertOneResult,
  MongoClient,
  ObjectId,
  OptionalUnlessRequiredId,
  ServerApiVersion,
  WithId,
} from 'mongodb';

export const ZKDATABASE_INDEX_COLLECTION = '_zkdatabase_index';
export const ZKDATABASE_INDEX_RECORD = '_zkindex';

type ZKDatabaseIndex = {
  [ZKDATABASE_INDEX_RECORD]: number;
};

export type ZKDatabaseIndexRecord = ZKDatabaseIndex & {
  collection: string;
  link: ObjectId;
};

export type IndexedDocument = ZKDatabaseIndex & Document;

export class DatabaseEngine {
  private static instance: DatabaseEngine;

  private mongoClient: MongoClient;

  private connection: MongoClient | undefined;

  private indexedCheck: Map<string, boolean> = new Map();

  public get client() {
    if (!this.connection) {
      throw new Error('Database was not connected');
    }
    return this.connection;
  }

  private constructor(uri: string) {
    this.mongoClient = new MongoClient(uri, {
      serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
      },
    });
  }

  public static getInstance(url?: string): DatabaseEngine {
    if (!DatabaseEngine.instance) {
      if (typeof url === 'undefined') {
        throw new Error('Database URL was not set');
      }
      DatabaseEngine.instance = new DatabaseEngine(url);
    }

    return DatabaseEngine.instance;
  }

  public async sync(database: string) {
    if (!this.indexedCheck.get(database)) {
      if (!(await this.isCollection(database, ZKDATABASE_INDEX_COLLECTION))) {
        await this.client
          .db(database)
          .collection(ZKDATABASE_INDEX_COLLECTION)
          .createIndex(ZKDATABASE_INDEX_RECORD, {
            unique: true,
          });
        this.indexedCheck.set(database, true);
      }
    }
  }

  public async isCollection(
    database: string,
    collection: string
  ): Promise<boolean> {
    for await (const iterCollection of this.client
      .db(database)
      .listCollections()) {
      if (iterCollection.name === collection) {
        return true;
      }
    }
    return false;
  }

  public async connect() {
    let error = true;
    do {
      try {
        this.connection = await this.mongoClient.connect();
        error = false;
      } catch (e) {
        console.log('DatabaseEngine::connect()', e);
        error = true;
      }
    } while (error);
  }

  public async disconnect() {
    await this.mongoClient.close();
    this.connection = undefined;
  }
}

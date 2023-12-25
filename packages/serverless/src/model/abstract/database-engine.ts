import { MongoClient, ObjectId, ServerApiVersion, Document } from 'mongodb';
import logger from '../../helper/logger';

export const ZKDATABASE_INDEX_RECORD = '_zkindex';
export const ZKDATABASE_INDEX_COLLECTION = '_zkdatabase_index';
export const ZKDATABASE_GROUP_PERMISSION_COLLECTION = '_zkdatabase_group';
export const ZKDATABASE_BASIC_PERMISSION_COLLECTION =
  '_zkdatabase_basic_permission';
export const ZKDATABASE_USER_PERMISSION_COLLECTION =
  '_zkdatabase_basic_permission';
export const ZKDATABASE_MANAGEMENT_DB = '_zkdatabase_management';

type ZKDatabaseIndex = {
  [ZKDATABASE_INDEX_RECORD]: number;
};

export type ZKDatabaseIndexRecord = ZKDatabaseIndex & {
  collection: string;
  link: ObjectId;
};

export type IndexedDocument = ZKDatabaseIndex & Document;

export class DatabaseEngine {
  private static innerInstance: any;

  private mongoClient: MongoClient;

  private connection: MongoClient | undefined;

  private indexedCheck: Map<string, boolean> = new Map();

  private static get instance(): DatabaseEngine {
    return DatabaseEngine.innerInstance;
  }

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
      DatabaseEngine.innerInstance = new DatabaseEngine(url);
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
    const collections = await this.client
      .db(database)
      .listCollections()
      .toArray();
    for (let i = 0; i < collections.length; i += 1) {
      if (collections[i].name === collection) {
        return true;
      }
    }
    return false;
  }

  public isConnected() {
    return this.connection !== undefined;
  }

  public async connect() {
    let error = true;
    let retries = 3;
    do {
      try {
        // eslint-disable-next-line no-await-in-loop
        this.connection = await this.mongoClient.connect();
        error = false;
      } catch (e) {
        logger.info('DatabaseEngine::connect()', e, 'retry', retries);
        retries -= 1;
        error = true;
      }
    } while (error && retries > 0);
  }

  public async disconnect() {
    await this.mongoClient.close();
    this.connection = undefined;
  }
}

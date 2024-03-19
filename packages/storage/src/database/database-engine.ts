import { MongoClient, ServerApiVersion } from 'mongodb';
import logger from '../helper/logger';

export class DatabaseEngine {
  private static innerInstance: any;

  private mongoClient: MongoClient;

  private connection: MongoClient | undefined;

  private static get instance(): DatabaseEngine {
    return DatabaseEngine.innerInstance;
  }

  public get db() {
    if (!this.connection) {
      throw new Error('Database was not connected');
    }
    return this.connection.db;
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

  public async isDatabase(database: string) {
    const databases = await this.client.db().admin().listDatabases();
    for (let i = 0; i < databases.databases.length; i += 1) {
      if (databases.databases[i].name === database) {
        return true;
      }
    }
    return false;
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
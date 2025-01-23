import { ListCollectionsOptions, MongoClient, ServerApiVersion } from 'mongodb';
import { logger } from '@helper';

export class DatabaseEngine {
  private static instances: Record<string, DatabaseEngine> = {};
  private mongoClient: MongoClient;
  private connection: MongoClient | null = null;

  private constructor(uri: string) {
    this.mongoClient = new MongoClient(uri, {
      serverApi: {
        version: ServerApiVersion.v1,
        strict: false,
        deprecationErrors: true,
      },
    });
  }

  public static getInstance(uri: string): DatabaseEngine {
    if (!DatabaseEngine.instances[uri]) {
      DatabaseEngine.instances[uri] = new DatabaseEngine(uri);
    }
    return DatabaseEngine.instances[uri];
  }

  public async isDatabase(database: string): Promise<boolean> {
    const { databases } = await this.client.db().admin().listDatabases();
    return databases.some((db) => db.name === database);
  }

  public async isCollection(
    database: string,
    collection: string,
    options?: ListCollectionsOptions
  ): Promise<boolean> {
    return (
      (await this.client
        .db(database)
        .listCollections(
          {
            name: collection,
          },
          options
        )
        .next()) !== null
    );
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

  public isConnected(): boolean {
    return this.connection !== null;
  }

  public async connect(): Promise<void> {
    let retries = 3;
    while (retries > 0) {
      try {
        const time = Date.now();
        // eslint-disable-next-line no-await-in-loop
        this.connection = await this.mongoClient.connect();
        logger.info(
          'DatabaseEngine::connect()',
          'Connected',
          Date.now() - time,
          'ms'
        );
        return;
      } catch (e) {
        logger.info('DatabaseEngine::connect()', e, 'retry', retries);
        retries -= 1;
        if (retries === 0) {
          throw e;
        }
      }
    }
  }

  public async disconnect(): Promise<void> {
    if (this.connection) {
      await this.mongoClient.close();
      this.connection = null;
    }
  }
}

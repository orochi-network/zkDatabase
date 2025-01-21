import {
  DATABASE_ENGINE,
  DatabaseEngine,
  ModelCollection,
  ModelGeneral,
  Transaction,
} from '../../src';
import { Db, MongoServerError } from 'mongodb';

const DATABASE_NAME = '__test_run_db_compound-transaction';
const COLLECTION_NAME = '__test_run_collection_compound-transaction';

describe('compound-transaction', () => {
  let minaDbClient: Db;
  let serverlessDbClient: Db;

  beforeAll(async () => {
    if (!DATABASE_ENGINE.dbMina.isConnected()) {
      await DATABASE_ENGINE.dbMina.connect();
      await DATABASE_ENGINE.dbServerless.connect();
    }

    minaDbClient = DATABASE_ENGINE.dbMina.client.db(DATABASE_NAME);
    serverlessDbClient = DATABASE_ENGINE.dbServerless.client.db(DATABASE_NAME);

    await minaDbClient.collection(COLLECTION_NAME).drop();
    await serverlessDbClient.collection(COLLECTION_NAME).drop();
  });

  afterAll(async () => {
    await DATABASE_ENGINE.dbServerless.disconnect();
    await DATABASE_ENGINE.dbMina.disconnect();
  });

  beforeEach(async () => {});

  afterEach(async () => {
    await minaDbClient.collection(COLLECTION_NAME).drop();
    await serverlessDbClient.collection(COLLECTION_NAME).drop();
  });

  test('successfully commit data in both instances', async () => {
    const modelCollectionMina = new ModelGeneral(
      DATABASE_NAME,
      DATABASE_ENGINE.dbMina,
      COLLECTION_NAME
    );

    const modelCollectionServerless = new ModelGeneral(
      DATABASE_NAME,
      DATABASE_ENGINE.dbServerless,
      COLLECTION_NAME
    );

    await Transaction.compound(async ({ sessionServerless, sessionMina }) => {
      await modelCollectionMina.collection.insertOne(
        { int: 1 },
        { session: sessionMina }
      );
      await modelCollectionServerless.collection.insertOne(
        { int: 1 },
        { session: sessionServerless }
      );
    });

    const minaData = await modelCollectionMina.collection.findOne({});
    const serverlessData = await modelCollectionServerless.collection.findOne(
      {}
    );
    expect(minaData).toEqual({ _id: expect.anything(), int: 1 });
    expect(serverlessData).toEqual({ _id: expect.anything(), int: 1 });
  });

  test('successfully rollback data in both instances', async () => {
    const modelCollectionMina = new ModelGeneral(
      DATABASE_NAME,
      DATABASE_ENGINE.dbMina,
      COLLECTION_NAME
    );

    const modelCollectionServerless = new ModelGeneral(
      DATABASE_NAME,
      DATABASE_ENGINE.dbServerless,
      COLLECTION_NAME
    );

    try {
      await Transaction.compound(async ({ sessionServerless, sessionMina }) => {
        await modelCollectionMina.collection.insertOne(
          { int: 1 },
          { session: sessionMina }
        );
        await modelCollectionServerless.collection.insertOne(
          { int: 1 },
          { session: sessionServerless }
        );

        const minaData = await modelCollectionMina.collection.findOne(
          {},
          { session: sessionMina }
        );
        const serverlessData =
          await modelCollectionServerless.collection.findOne(
            {},
            { session: sessionServerless }
          );

        expect(minaData).toEqual({ _id: expect.anything(), int: 1 });
        expect(serverlessData).toEqual({ _id: expect.anything(), int: 1 });

        throw new Error('rollback');
      });
    } catch (error) {
      if (error instanceof Error) {
        expect(error.message).toBe('rollback');
      } else {
        throw new Error(
          `The error should be the error that we threw above, got something else: ${error}`
        );
      }
    }

    const minaData = await modelCollectionMina.collection.findOne({});
    const serverlessData = await modelCollectionServerless.collection.findOne(
      {}
    );
    expect(minaData).toBeNull();
    expect(serverlessData).toBeNull();
  });

  test('to fail when creating indexes inside a transaction for a existing collection', async () => {
    try {
      const modelCollectionMina = new ModelCollection(
        DATABASE_NAME,
        DATABASE_ENGINE.dbMina,
        COLLECTION_NAME
      );

      const modelCollectionServerless = new ModelCollection(
        DATABASE_NAME,
        DATABASE_ENGINE.dbServerless,
        COLLECTION_NAME
      );

      await modelCollectionMina.create({ int: 1 });
      await modelCollectionServerless.create({ int: 1 });

      await Transaction.compound(async ({ sessionServerless, sessionMina }) => {
        await modelCollectionMina.collection.createIndex(
          { something: 1 },
          { unique: true, session: sessionMina }
        );
        await modelCollectionServerless.collection.createIndex(
          { something: 1 },
          { unique: true, session: sessionServerless }
        );
      });
    } catch (e) {
      if (e instanceof MongoServerError) {
        expect(e.codeName).toBe('OperationNotSupportedInTransaction');
      } else {
        throw new Error(
          `The error should be a MongoServerError, got something else: ${e}`
        );
      }
    }
  });
});

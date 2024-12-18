import {
  ETransactionType,
  TTransaction,
  TTransactionRecord,
} from '@zkdb/common';
import {
  ClientSession,
  Filter,
  FindOptions,
  OptionalId,
  WithId,
} from 'mongodb';
import { zkDatabaseConstant } from '@common';
import { addTimestampMongoDB, DATABASE_ENGINE } from '@helper';
import { ModelGeneral } from '../base';
import { ModelCollection } from '../general';

export class ModelTransaction extends ModelGeneral<
  OptionalId<TTransactionRecord>
> {
  private static instance: ModelTransaction;

  private constructor() {
    super(
      zkDatabaseConstant.globalDatabase,
      DATABASE_ENGINE.serverless,
      zkDatabaseConstant.globalCollection.transaction
    );
  }

  public static getInstance() {
    if (!ModelTransaction.instance) {
      this.instance = new ModelTransaction();
    }
    return this.instance;
  }

  public async list(
    databaseName: string,
    transactionType: ETransactionType,
    options?: FindOptions
  ): Promise<WithId<TTransactionRecord>[]> {
    return this.collection
      .find({ databaseName, transactionType }, options)
      .toArray();
  }

  public async count(filter?: Filter<TTransaction>) {
    return await this.collection.countDocuments(filter);
  }

  public static async init(session?: ClientSession) {
    const collection = ModelCollection.getInstance<TTransactionRecord>(
      zkDatabaseConstant.globalDatabase,
      DATABASE_ENGINE.serverless,
      zkDatabaseConstant.globalCollection.transaction
    );
    /*
      transactionType: ETransactionType;
      databaseName: string;
      status: ETransactionStatus;
      transactionRaw: string;
      txHash: string;
      error: string;
    */
    if (!(await collection.isExist())) {
      await collection.index({ databaseName: 1 }, { session });
      await collection.index(
        { databaseName: 1, transactionType: 1, txHash: 1 },
        { unique: false }
      );

      await addTimestampMongoDB(collection, session);
    }
  }
}

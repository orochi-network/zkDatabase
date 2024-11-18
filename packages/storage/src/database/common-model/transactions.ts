import {
  Document,
  Filter,
  FindOptions,
  InsertOneResult,
  ObjectId,
  ReplaceOptions,
  UpdateResult,
  WithId,
} from 'mongodb';
import ModelBasic from '../base/basic';
import { DatabaseEngine } from '../database-engine';
import { zkDatabaseConstants } from '@common';
import { ModelCollection } from '../general';

export type TransactionType = 'deploy' | 'rollup';

export type TransactionStatus =
  | 'start'
  | 'ready'
  | 'pending'
  | 'failed'
  | 'success'
  | 'unknown';

export type DbTransaction = {
  transactionType: TransactionType;
  databaseName: string;
  tx?: string;
  status: TransactionStatus;
  txHash?: string;
  error?: string;
  createdAt: Date;
};

export class ModelDbTransaction extends ModelBasic<DbTransaction> {
  private static instance: ModelDbTransaction;
  private static dbEngine: DatabaseEngine;

  private constructor() {
    super(
      zkDatabaseConstants.globalDatabase,
      ModelDbTransaction.dbEngine,
      zkDatabaseConstants.globalCollections.transaction
    );
  }
  public static createModel(dbEngine: DatabaseEngine) {
    ModelDbTransaction.dbEngine = dbEngine;
  }

  public static getInstance() {
    if (!ModelDbTransaction.instance) {
      this.instance = new ModelDbTransaction();
    }
    return this.instance;
  }

  public async create(
    args: DbTransaction,
    options?: ReplaceOptions
  ): Promise<Document | InsertOneResult<DbTransaction>> {
    const result = await this.collection.insertOne(args, { ...options });

    return result;
  }

  public async updateById(
    id: string,
    args: Partial<DbTransaction>,
    options?: ReplaceOptions
  ): Promise<Document | UpdateResult<DbTransaction>> {
    const result = await this.collection.updateOne(
      { _id: new ObjectId(id) },
      { $set: args },
      { ...options }
    );

    return result;
  }

  public async getTxs(
    databaseName: string,
    transactionType: TransactionType,
    options?: FindOptions
  ): Promise<Array<WithId<DbTransaction>>> {
    return this.collection
      .find({ databaseName, transactionType }, options)
      .toArray();
  }

  public async findById(id: string, options?: FindOptions) {
    const tx = await this.collection.findOne(
      { _id: new ObjectId(id) },
      options
    );
    return tx;
  }

  public async remove(databaseName: string, transactionType: TransactionType) {
    const res = await this.collection.deleteOne({
      databaseName,
      transactionType,
    });
    return res.deletedCount === 1;
  }

  public async count(filter?: Filter<DbTransaction>) {
    return await this.collection.countDocuments(filter);
  }

  public static async init(dbEngine: DatabaseEngine) {
    ModelDbTransaction.createModel(dbEngine);
    const collection = ModelCollection.getInstance(
      zkDatabaseConstants.globalDatabase,
      dbEngine,
      zkDatabaseConstants.globalCollections.transaction
    );
    if (!(await collection.isExist())) {
      await collection.index(
        { databaseName: 1, transactionType: 1 },
        { unique: false }
      );
    }
  }
}

import {
  ETransactionType,
  TTransaction,
  TTransactionRecord,
} from '@zkdb/common';
import {
  ClientSession,
  DeleteResult,
  Filter,
  FindOptions,
  InsertOneResult,
  ObjectId,
  ReplaceOptions,
  UpdateResult,
  WithId,
  WithoutId,
} from 'mongodb';
import { zkDatabaseConstant } from '../../common/const.js';
import { DB } from '../../helper/db-instance.js';
import ModelBasic from '../base/basic.js';
import ModelCollection from '../general/collection.js';
import { addTimestampMongoDB } from '../../helper/common.js';

export class ModelTransaction extends ModelBasic<
  WithoutId<TTransactionRecord>
> {
  private static instance: ModelTransaction;

  private constructor() {
    super(
      zkDatabaseConstant.globalDatabase,
      DB.service,
      zkDatabaseConstant.globalCollection.transaction
    );
  }

  public static getInstance() {
    if (!ModelTransaction.instance) {
      this.instance = new ModelTransaction();
    }
    return this.instance;
  }

  public async create(
    args: WithoutId<TTransactionRecord>,
    options?: ReplaceOptions
  ): Promise<InsertOneResult<TTransactionRecord>> {
    const result = await this.collection.insertOne(args, { ...options });

    return result;
  }

  public async updateById(
    id: ObjectId,
    args: Partial<TTransaction>,
    options?: ReplaceOptions
  ): Promise<UpdateResult<TTransactionRecord>> {
    const result = await this.collection.updateOne(
      { _id: new ObjectId(id) },
      { $set: args },
      { ...options }
    );

    return result;
  }

  public async updateByTxHash(
    txHash: string,
    args: Partial<TTransaction>,
    options?: ReplaceOptions
  ): Promise<UpdateResult<TTransactionRecord>> {
    const result = await this.collection.updateOne(
      { txHash },
      { $set: args },
      { ...options }
    );

    return result;
  }

  public async getTxs(
    databaseName: string,
    transactionType: ETransactionType,
    options?: FindOptions
  ): Promise<WithId<TTransactionRecord>[]> {
    return this.collection
      .find({ databaseName, transactionType }, options)
      .toArray();
  }

  public async findById(id: string, options?: FindOptions) {
    const tx = await this.collection.findOne(
      { _id: new ObjectId(id) },
      options
    );
    // I must perform this type cast
    return tx;
  }

  public async remove(
    databaseName: string,
    transactionType: ETransactionType
  ): Promise<DeleteResult> {
    const res = await this.collection.deleteOne({
      databaseName,
      transactionType,
    });
    return res;
  }

  public async count(filter?: Filter<TTransaction>) {
    return await this.collection.countDocuments(filter);
  }

  public static async init(session?: ClientSession) {
    const collection = ModelCollection.getInstance<TTransactionRecord>(
      zkDatabaseConstant.globalDatabase,
      DB.service,
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

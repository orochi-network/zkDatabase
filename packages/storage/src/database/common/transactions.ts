import {
  ETransactionType,
  TDbRecordOptional,
  TTransaction,
  TTransactionRecord,
} from '@zkdb/common';
import {
  DeleteResult,
  Filter,
  FindOptions,
  InsertOneResult,
  ObjectId,
  ReplaceOptions,
  UpdateResult,
  WithId,
} from 'mongodb';
import { zkDatabaseConstants } from '../../common/const.js';
import { DB } from '../../helper/db-instance.js';
import ModelBasic from '../base/basic.js';
import ModelCollection from '../general/collection.js';

export class ModelTransaction extends ModelBasic<TTransactionRecord> {
  private static instance: ModelTransaction;

  private constructor() {
    super(
      zkDatabaseConstants.globalDatabase,
      DB.service,
      zkDatabaseConstants.globalCollections.transaction
    );
  }

  public static getInstance() {
    if (!ModelTransaction.instance) {
      this.instance = new ModelTransaction();
    }
    return this.instance;
  }

  public async create(
    args: TDbRecordOptional<TTransactionRecord>,
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

  public async findById(
    id: string,
    options?: FindOptions
  ): Promise<WithId<TTransactionRecord> | null> {
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

  public static async init() {
    const collection = ModelCollection.getInstance<TTransactionRecord>(
      zkDatabaseConstants.globalDatabase,
      DB.service,
      zkDatabaseConstants.globalCollections.transaction
    );
    if (!(await collection.isExist())) {
      await collection.index(
        { databaseName: 1, transactionType: 1, txHash: 1 },
        { unique: false }
      );
    }
  }
}

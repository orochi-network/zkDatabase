import {
  Filter,
  FindOptions,
  ReplaceOptions,
  UpdateResult,
  Document,
} from 'mongodb';
import { zkDatabaseConstants } from '../../common/const.js';
import { DB } from '../../helper/db-instance.js';
import ModelBasic from '../base/basic.js';
import ModelCollection from '../general/collection.js';

export type TransactionType = 'deploy' | 'rollup';

export type DbTransaction = {
  transactionType: TransactionType;
  databaseName: string;
  tx: string;
};

export class ModelDbDeployTx extends ModelBasic<DbTransaction> {
  private static instance: ModelDbDeployTx;

  private constructor() {
    super(
      zkDatabaseConstants.globalDatabase,
      DB.service,
      zkDatabaseConstants.globalCollections.deploy
    );
  }

  public static getInstance() {
    if (!ModelDbDeployTx.instance) {
      this.instance = new ModelDbDeployTx();
    }
    return this.instance;
  }

  public async create(
    args: DbTransaction,
    options?: ReplaceOptions
  ): Promise<Document | UpdateResult<DbTransaction>> {
    const result = await this.collection.replaceOne(
      {
        transactionType: args.transactionType,
        databaseName: args.databaseName,
      },
      args,
      { ...options, upsert: true }
    );

    return result;
  }

  public async getTx(
    databaseName: string,
    transactionType: TransactionType,
    options?: FindOptions
  ): Promise<DbTransaction | null> {
    const tx = await this.collection.findOne(
      { databaseName, transactionType },
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

  public static async init() {
    const collection = ModelCollection.getInstance(
      zkDatabaseConstants.globalDatabase,
      zkDatabaseConstants.globalCollections.deploy
    );
    if (!(await collection.isExist())) {
      await collection.index(
        { databaseName: 1, transactionType: 1 },
        { unique: true }
      );
    }
  }
}

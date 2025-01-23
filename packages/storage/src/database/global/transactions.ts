import { zkDatabaseConstant } from '@common';
import { DATABASE_ENGINE } from '@helper';
import { TTransactionRecord, TTransactionRecordNullable } from '@zkdb/common';
import { ClientSession, Filter, OptionalId } from 'mongodb';
import { ModelGeneral } from '../base';
import { ModelCollection } from '../general';

export class ModelTransaction extends ModelGeneral<
  OptionalId<TTransactionRecordNullable>
> {
  private static instance: ModelTransaction;

  private constructor() {
    super(
      zkDatabaseConstant.globalDatabase,
      DATABASE_ENGINE.dbServerless,
      zkDatabaseConstant.globalCollection.transaction
    );
  }

  public static getInstance() {
    if (!ModelTransaction.instance) {
      this.instance = new ModelTransaction();
    }
    return this.instance;
  }

  public async count(filter?: Filter<TTransactionRecordNullable>) {
    return await this.collection.countDocuments(filter);
  }

  public static async init(session?: ClientSession) {
    const collection = ModelCollection.getInstance<TTransactionRecord>(
      zkDatabaseConstant.globalDatabase,
      DATABASE_ENGINE.dbServerless,
      zkDatabaseConstant.globalCollection.transaction
    );

    if (!(await collection.isExist())) {
      await collection.createSystemIndex({ databaseName: 1 }, { session });
      await collection.createSystemIndex(
        { databaseName: 1, transactionType: 1, txHash: 1 },
        { session }
      );

      await collection.addTimestampMongoDb({ session });
    }
  }
}

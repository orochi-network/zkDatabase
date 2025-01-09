import { zkDatabaseConstant } from '@common';
import { DATABASE_ENGINE } from '@helper';
import { TTransactionRecord, TTransactionRecordNullable } from '@zkdb/common';
import { ClientSession, Filter, OptionalId } from 'mongodb';
import { ModelGeneral } from '../base';
import { ModelCollection } from '../general';

export class ModelRollupOnChain extends ModelGeneral<
  OptionalId<TTransactionRecordNullable>
> {
  private static instance: ModelRollupOnChain;

  private constructor() {
    super(
      zkDatabaseConstant.globalProofDatabase,
      DATABASE_ENGINE.proofService,
      zkDatabaseConstant.globalCollection.rollupOnChain
    );
  }

  public static getInstance() {
    if (!ModelRollupOnChain.instance) {
      this.instance = new ModelRollupOnChain();
    }
    return this.instance;
  }

  public async count(filter?: Filter<TTransactionRecordNullable>) {
    return await this.collection.countDocuments(filter);
  }

  public static async init(session?: ClientSession) {
    const collection = ModelCollection.getInstance<TTransactionRecord>(
      zkDatabaseConstant.globalProofDatabase,
      DATABASE_ENGINE.proofService,
      zkDatabaseConstant.globalCollection.rollupOnChain
    );

    if (!(await collection.isExist())) {
      await collection.createSystemIndex({ databaseName: 1 }, { session });

      await collection.addTimestampMongoDb({ session });
    }
  }
}

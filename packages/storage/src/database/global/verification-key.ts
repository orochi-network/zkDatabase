import { zkDatabaseConstant } from '@common';
import { DATABASE_ENGINE } from '@helper';
import { TTransactionRecord, TTransactionRecordNullable } from '@zkdb/common';
import { ClientSession, Filter, OptionalId } from 'mongodb';
import { ModelGeneral } from '../base';
import { ModelCollection } from '../general';

export class ModelVerificationKey extends ModelGeneral<
  OptionalId<TTransactionRecordNullable>
> {
  private static instance: ModelVerificationKey;

  private constructor() {
    super(
      zkDatabaseConstant.globalProofDatabase,
      DATABASE_ENGINE.proofService,
      zkDatabaseConstant.globalCollection.verificationKey
    );
  }

  public static getInstance() {
    if (!ModelVerificationKey.instance) {
      this.instance = new ModelVerificationKey();
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
      zkDatabaseConstant.globalCollection.verificationKey
    );

    if (!(await collection.isExist())) {
      await collection.createSystemIndex(
        { verificationKeyHash: 1 },
        { unique: true, session }
      );
      await collection.createSystemIndex({ verificationKey: 1 }, { session });

      await collection.addTimestampMongoDb({ session });
    }
  }
}

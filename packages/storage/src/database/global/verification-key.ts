import { zkDatabaseConstant } from '@common';
import { DATABASE_ENGINE } from '@helper';
import { TZkDbVerificationKeyRecord } from '@zkdb/common';
import { ClientSession, Filter, OptionalId } from 'mongodb';
import { ModelGeneral } from '../base';
import { ModelCollection } from '../general';

export class ModelVerificationKey extends ModelGeneral<
  OptionalId<TZkDbVerificationKeyRecord>
> {
  private static instance: ModelVerificationKey;

  private constructor() {
    super(
      zkDatabaseConstant.globalMinaDatabase,
      DATABASE_ENGINE.dbMina,
      zkDatabaseConstant.globalCollection.verificationKey
    );
  }

  public static getInstance() {
    if (!ModelVerificationKey.instance) {
      this.instance = new ModelVerificationKey();
    }
    return this.instance;
  }

  public async count(filter?: Filter<TZkDbVerificationKeyRecord>) {
    return await this.collection.countDocuments(filter);
  }

  public static async init(session?: ClientSession) {
    const collection = ModelCollection.getInstance<TZkDbVerificationKeyRecord>(
      zkDatabaseConstant.globalMinaDatabase,
      DATABASE_ENGINE.dbMina,
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

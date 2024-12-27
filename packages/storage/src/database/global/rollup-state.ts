import { TRollUpHistoryRecord } from '@zkdb/common';
import { ClientSession, OptionalId, WithoutId } from 'mongodb';
import { zkDatabaseConstant } from '@common';
import { addTimestampMongoDB, DATABASE_ENGINE } from '@helper';
import { ModelGeneral } from '../base';
import { ModelCollection } from '../general';

export class ModelRollupStatus extends ModelGeneral<
  OptionalId<TRollUpHistoryRecord>
> {
  private static instance: ModelRollupStatus;

  private constructor(databaseName: string) {
    super(
      databaseName,
      DATABASE_ENGINE.serverless,
      zkDatabaseConstant.databaseCollection.rollupState
    );
  }

  public static getInstance(databaseName: string) {
    if (!ModelRollupStatus.instance) {
      this.instance = new ModelRollupStatus(databaseName);
    }
    return this.instance;
  }

  public static async init(databaseName: string, session?: ClientSession) {
    const collection = ModelCollection.getInstance<
      WithoutId<TRollUpHistoryRecord>
    >(
      databaseName,
      DATABASE_ENGINE.serverless,
      zkDatabaseConstant.databaseCollection.rollupState
    );
    /*
      databaseName: string;
    */
    if (!(await collection.isExist())) {
      await collection.index({ databaseName: 1 }, { unique: true, session });

      await addTimestampMongoDB(collection, session);
    }
  }
}

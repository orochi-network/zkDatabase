import { zkDatabaseConstant } from '@common';
import { DATABASE_ENGINE } from '@helper';
import { TRollUpHistoryRecord } from '@zkdb/common';
import { ClientSession, OptionalId, WithoutId } from 'mongodb';
import { ModelGeneral } from '../base';
import { ModelCollection } from '../general';

export class ModelRollup extends ModelGeneral<
  OptionalId<TRollUpHistoryRecord>
> {
  private static instance: ModelRollup;

  private constructor() {
    super(
      zkDatabaseConstant.globalDatabase,
      DATABASE_ENGINE.serverless,
      zkDatabaseConstant.globalCollection.rollup
    );
  }

  public static getInstance() {
    if (!ModelRollup.instance) {
      this.instance = new ModelRollup();
    }
    return this.instance;
  }

  public static async init(session?: ClientSession) {
    const collection = ModelCollection.getInstance<
      WithoutId<TRollUpHistoryRecord>
    >(
      zkDatabaseConstant.globalProofDatabase,
      DATABASE_ENGINE.proofService,
      zkDatabaseConstant.globalCollection.proof
    );
    /*
      databaseName: string;
      merkletreeRoot: string;
      merkletreeRootPrevious: string;
      transactionObjectId: ObjectId;
      proofObjectId: ObjectId;
    */
    if (!(await collection.isExist())) {
      await collection.createSystemIndex(
        { databaseName: 1 },
        { unique: true, session }
      );
      await collection.createSystemIndex(
        { merkletreeRoot: 1 },
        { unique: true, session }
      );
      await collection.createSystemIndex(
        { merkletreeRootPrevious: 1 },
        { unique: true, session }
      );
      await collection.createSystemIndex(
        { proofObjectId: 1 },
        { unique: true, session }
      );
      await collection.createSystemIndex(
        { transactionObjectId: 1 },
        { unique: true, session }
      );

      await collection.addTimestampMongoDb({ session });
    }
  }
}

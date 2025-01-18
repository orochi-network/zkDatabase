/* eslint-disable no-await-in-loop */

import { zkDatabaseConstant } from '@common';
import { DATABASE_ENGINE } from '@helper';
import { TTransitionLogRecord } from '@zkdb/common';
import { ClientSession, OptionalId } from 'mongodb';
import { ModelGeneral } from '../base';
import { ModelCollection } from '../general';

export class ModelTransitionLog extends ModelGeneral<
  OptionalId<TTransitionLogRecord>
> {
  private static instances = new Map<string, ModelTransitionLog>();

  private constructor(databaseName: string) {
    super(
      zkDatabaseConstant.globalTransitionLogDatabase,
      DATABASE_ENGINE.minaService,
      databaseName
    );
  }

  /** Session is required to avoid concurrency issues such as write conflict
   * while initializing the collection (create index, etc.) and writing to the
   * collection at the same time. */
  public static async getInstance(
    databaseName: string,
    session: ClientSession
  ): Promise<ModelTransitionLog> {
    if (!ModelTransitionLog.instances.has(databaseName)) {
      ModelTransitionLog.instances.set(
        databaseName,
        new ModelTransitionLog(databaseName)
      );
      await ModelTransitionLog.init(databaseName, session);
    }
    return ModelTransitionLog.instances.get(databaseName)!;
  }

  public static async init(databaseName: string, session?: ClientSession) {
    const collection = ModelCollection.getInstance(
      zkDatabaseConstant.globalTransitionLogDatabase,
      DATABASE_ENGINE.minaService,
      databaseName
    );
    if (!(await collection.isExist())) {
      // TODO: are there any other indexes that need to be created?
      await collection.createSystemIndex(
        { operationNumber: 1 },
        { unique: true, session }
      );
      await collection.addTimestampMongoDb({ session });
    }
  }
}

export default ModelTransitionLog;

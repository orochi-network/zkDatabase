import { TGroupRecord } from '@zkdb/common';
import {
  addTimestampMongoDB,
  DATABASE_ENGINE,
  ModelCollection,
  ModelGeneral,
  zkDatabaseConstant,
} from '@zkdb/storage';
import { ClientSession, InsertOneOptions, WithoutId } from 'mongodb';

export class ModelGroup extends ModelGeneral<WithoutId<TGroupRecord>> {
  private static collectionName: string =
    zkDatabaseConstant.databaseCollection.group;

  constructor(databaseName: string) {
    super(databaseName, DATABASE_ENGINE.serverless, ModelGroup.collectionName);
  }

  public async create(
    args: WithoutId<TGroupRecord>,
    options?: InsertOneOptions
  ) {
    return this.insertOne(args, options);
  }

  public static async init(databaseName: string, session?: ClientSession) {
    const collection = ModelCollection.getInstance(
      databaseName,
      DATABASE_ENGINE.serverless,
      ModelGroup.collectionName
    );
    /*
      groupName: string;
      groupDescription: string;
      createdBy: string;
      createdAt: Date
      updatedAt: Date
    */
    if (!(await collection.isExist())) {
      await collection.index({ groupName: 1 }, { unique: true, session });

      await addTimestampMongoDB(collection, session);
    }
  }
}

export default ModelGroup;

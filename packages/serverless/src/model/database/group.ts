import { TGroupRecord } from '@zkdb/common';
import {
  addTimestampMongoDB,
  DB,
  ModelCollection,
  ModelGeneral,
  zkDatabaseConstant,
} from '@zkdb/storage';
import { ClientSession, InsertOneOptions, WithoutId } from 'mongodb';

export class ModelGroup extends ModelGeneral<WithoutId<TGroupRecord>> {
  private static collectionName: string =
    zkDatabaseConstant.databaseCollection.group;

  constructor(databaseName: string) {
    super(databaseName, DB.service, ModelGroup.collectionName);
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
      DB.service,
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

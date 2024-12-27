import { ModelUserGroup } from '@model';
import { TGroupRecord } from '@zkdb/common';
import {
  addTimestampMongoDB,
  DATABASE_ENGINE,
  ModelCollection,
  ModelGeneral,
  zkDatabaseConstant,
} from '@zkdb/storage';
import { ClientSession, ObjectId, OptionalId } from 'mongodb';

export class ModelGroup extends ModelGeneral<OptionalId<TGroupRecord>> {
  private static collectionName: string =
    zkDatabaseConstant.databaseCollection.group;

  constructor(databaseName: string) {
    super(databaseName, DATABASE_ENGINE.serverless, ModelGroup.collectionName);
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

  /** Drop group and all user in group. */
  public async dropGroup(groupObjectId: ObjectId, session: ClientSession) {
    const imUserGroup = new ModelUserGroup(this.databaseName);

    await imUserGroup.deleteMany({ groupObjectId }, session);
    await this.deleteOne({ _id: groupObjectId }, session);
  }
}

export default ModelGroup;

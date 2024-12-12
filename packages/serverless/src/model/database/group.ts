import { TGroupRecord } from '@zkdb/common';
import {
  DB,
  ModelCollection,
  ModelGeneral,
  zkDatabaseConstant,
} from '@zkdb/storage';
import { ClientSession, InsertOneOptions, WithoutId } from 'mongodb';
import { ZKDATABASE_USER_SYSTEM } from '../../common/const.js';
import { getCurrentTime } from '../../helper/common.js';
import { addTimestampMongoDB } from '@zkdb/storage';

export class ModelGroup extends ModelGeneral<WithoutId<TGroupRecord>> {
  private static collectionName: string =
    zkDatabaseConstant.databaseCollection.group;

  constructor(databaseName: string) {
    super(databaseName, DB.service, ModelGroup.collectionName);
  }

  public async createGroup(
    groupName: string,
    description?: string,
    createdBy?: string,
    options?: InsertOneOptions
  ) {
    return this.insertOne(
      {
        groupName,
        groupDescription: description || `Group ${groupName}`,
        createdBy: createdBy || ZKDATABASE_USER_SYSTEM,
        createdAt: getCurrentTime(),
        updatedAt: getCurrentTime(),
      },
      options
    );
  }

  public async findGroup(groupName: string, session?: ClientSession) {
    return this.collection.findOne({ groupName }, { session });
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

import {
  DB,
  ModelCollection,
  ModelGeneral,
  zkDatabaseConstants,
} from '@zkdb/storage';
import { ClientSession, Document, InsertOneOptions } from 'mongodb';
import { ZKDATABASE_USER_SYSTEM } from '../../common/const.js';
import { getCurrentTime } from '../../helper/common.js';

export interface GroupSchema extends Document {
  groupName: string;
  description: string;
  createBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export class ModelGroup extends ModelGeneral<GroupSchema> {
  private static collectionName: string =
    zkDatabaseConstants.databaseCollections.group;

  constructor(databaseName: string) {
    super(databaseName, DB.service, ModelGroup.collectionName);
  }

  public async createGroup(
    groupName: string,
    description?: string,
    createBy?: string,
    options?: InsertOneOptions
  ) {
    return this.insertOne(
      {
        groupName,
        description: description || `Group ${groupName}`,
        createBy: createBy || ZKDATABASE_USER_SYSTEM,
        createdAt: getCurrentTime(),
        updatedAt: getCurrentTime(),
      },
      options
    );
  }

  public async findGroup(
    groupName: string,
    session?: ClientSession
  ): Promise<GroupSchema | null> {
    return this.collection.findOne({ groupName }, { session });
  }

  public static async init(databaseName: string) {
    const collection = ModelCollection.getInstance(
      databaseName,
      ModelGroup.collectionName
    );
    if (!(await collection.isExist())) {
      await collection.index({ groupName: 1 }, { unique: true });
    }
  }
}

export default ModelGroup;

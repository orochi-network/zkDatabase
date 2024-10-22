import { ClientSession, Document, InsertOneOptions } from 'mongodb';
import {
  DatabaseEngine,
  ModelCollection,
  ModelGeneral,
  NetworkId,
  zkDatabaseConstants,
} from '@zkdb/storage';
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

  private constructor(databaseName: string) {
    super(databaseName, ModelGroup.collectionName);
  }

  public static getInstance(databaseName: string, networkId: NetworkId) {
    return new ModelGroup(DatabaseEngine.getValidName(databaseName, networkId));
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
        updatedAt: getCurrentTime()
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

  public static async init(databaseName: string, networkId: NetworkId) {
    const collection = ModelCollection.getInstance(
      databaseName,
      ModelGroup.collectionName,
      networkId
    );
    if (!(await collection.isExist())) {
      await collection.index(
        { networkId: 1, groupName: 1 },
        { unique: true, name: 'unique_groupName_per_network' }
      );
    }
  }
}

export default ModelGroup;

import { Document } from 'mongodb';
import {
  ZKDATABAES_USER_SYSTEM,
  ZKDATABASE_GROUP_COLLECTION,
} from '../../common/const';
import ModelCollection from '../abstract/collection';
import { ModelGeneral } from '../abstract/general';

export interface GroupSchema extends Document {
  groupName: string;
  description: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export class ModelGroup extends ModelGeneral<Partial<GroupSchema>> {
  static collectionName: string = ZKDATABASE_GROUP_COLLECTION;

  constructor(databaseName: string) {
    super(databaseName, ModelGroup.collectionName);
  }

  public async createGroup(
    groupName: string,
    description?: string,
    createBy?: string
  ) {
    return this.insertOne({
      groupName,
      description: description || `Group ${groupName}`,
      createBy: createBy || ZKDATABAES_USER_SYSTEM,
    });
  }

  public static async init(databaseName: string) {
    const collection = ModelCollection.getInstance(
      databaseName,
      ModelGroup.collectionName
    );
    if (!(await collection.isExist())) {
      await collection.create({ grouName: 1 }, { unique: true });
    }
  }
}

export default ModelGroup;

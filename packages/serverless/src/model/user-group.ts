import { ObjectId } from 'mongodb';
import ModelCollection from './collection';
import { ZKDATABASE_USER_GROUP_COLLECTION } from './abstract/database-engine';
import { ModelGeneral } from './general';

export type UserGroupSchema = {
  username: string;
  groupId: ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

export class ModelUserGroup extends ModelGeneral {
  constructor(databaseName: string) {
    super(databaseName, ZKDATABASE_USER_GROUP_COLLECTION);
  }

  public async create() {
    return new ModelCollection(this.databaseName, this.collectionName).create([
      'username',
      'groupId',
    ]);
  }
}

export default ModelUserGroup;

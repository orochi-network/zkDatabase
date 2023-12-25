import { ObjectId } from 'mongodb';
import { ZKDATABASE_GROUP_PERMISSION_COLLECTION } from './abstract/database-engine';
import ModelCollection from './collection';
import { ModelGeneral } from './general';
import { UserPermission } from '../common/permission';

export type GroupPermissionSchema = {
  userName: string;
  groupName: string;
  collection: string;
  docId: ObjectId;
  createdAt: Date;
  updatedAt: Date;
} & UserPermission;

export class ModelGroupPermission extends ModelGeneral {
  constructor(databaseName: string) {
    super(databaseName, ZKDATABASE_GROUP_PERMISSION_COLLECTION);
  }

  public async create() {
    return new ModelCollection(this.databaseName, this.collectionName).create([
      'userName',
      'groupName',
      'collection',
      'docId',
      'read',
      'write',
      'delete',
      'insert',
    ]);
  }
}

export default ModelGroupPermission;

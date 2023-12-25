import { ZKDATABASE_GROUP_PERMISSION_COLLECTION } from './abstract/database-engine';
import ModelCollection from './collection';
import { ModelGeneral } from './general';

export type GroupPermissionSchema = {
  groupName: string;
  description: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
};

export class ModelGroupPermission extends ModelGeneral {
  constructor(databaseName: string) {
    super(databaseName, ZKDATABASE_GROUP_PERMISSION_COLLECTION);
  }

  public async create() {
    return new ModelCollection(this.databaseName, this.collectionName).create([
      'groupName',
    ]);
  }
}

export default ModelGroupPermission;

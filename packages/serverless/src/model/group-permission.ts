import { ObjectId } from 'mongodb';
import { ZKDATABASE_GROUP_PERMISSION_COLLECTION } from './abstract/database-engine';
import { ModelGeneral } from './general';
import { UserPermission } from '../common/permission';
import ModelCollection from './collection';

// Permission of a group for collection
export type GroupPermissionSchema = {
  groupId: ObjectId;
  collection: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
} & UserPermission;

export class ModelGroupPermission extends ModelGeneral {
  constructor(databaseName: string) {
    super(databaseName, ZKDATABASE_GROUP_PERMISSION_COLLECTION);
  }

  public async create() {
    return new ModelCollection(this.databaseName, this.collectionName).create([
      'groupId',
      'userName',
      'collection',
      'docId',
      'read',
      'write',
      'delete',
      'insert',
    ]);
  }

  /**
   * Derive permission from a group, create basic permission for any user belongs to the group
   * These permissions can be overridden by user permission basic permission is insert and read
   * User unable modify or delete data
   * @param actor Username of admin
   * @param groupName Group name
   * @param permissions User permission
   */
  public async derivePermission(
    actor: string,
    groupName: string,
    permissions: UserPermission = {
      insert: true,
      read: true,
      write: false,
      delete: false,
    }
  ) {
    const groupPermission = await this.findOne({
      groupName,
    });
    if (groupPermission) {
      this.insertOne({
        groupId: groupPermission._id,
        groupName,
        ...permissions,
        createdBy: actor,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
    throw new Error(
      'The given group name is not found, can not derive permissions'
    );
  }
}

export default ModelGroupPermission;

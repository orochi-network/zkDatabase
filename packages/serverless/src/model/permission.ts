import { ObjectId } from 'mongodb';
import { ZKDATABASE_USER_PERMISSION_COLLECTION } from './abstract/database-engine';
import ModelCollection from './collection';
import { ModelGeneral } from './general';
import { PermissionRecord } from '../common/permission';
import ModelUserGroup from './user-group';

export type PermissionSchema = {
  username: string;
  userPermission: PermissionRecord;
  groupName: string;
  groupPermission: PermissionRecord;
  collection: string;
  docId: ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

export class ModelPermission extends ModelGeneral {
  constructor(databaseName: string) {
    super(databaseName, ZKDATABASE_USER_PERMISSION_COLLECTION);
  }

  // @dev: Do we need to do map reduce here?
  public async getPermission(
    actor: string,
    docId: ObjectId,
    collection: string
  ): Promise<PermissionRecord> {
    const permission = await this.findOne({ docId, collection });
    if (permission) {
      // User == actor -> return user permission
      if (permission.username === actor) {
        return permission.userPermission;
      }
      // User != actor -> check for group permission
      const modelUserGroup = new ModelUserGroup(this.databaseName!);
      const actorGroup = await modelUserGroup.listUserGroupName(actor);
      if (actorGroup.includes(permission.groupName)) {
        return permission.groupPermission;
      }
    }
    // Default deny all
    return {
      read: false,
      write: false,
      delete: false,
      insert: false,
    };
  }

  public static async init(databaseName: string) {
    return new ModelCollection(
      databaseName,
      ZKDATABASE_USER_PERMISSION_COLLECTION
    ).create([
      'username',
      'userPermission.read',
      'userPermission.write',
      'userPermission.delete',
      'userPermission.insert',
      'groupName',
      'groupPermission.read',
      'groupPermission.write',
      'groupPermission.delete',
      'groupPermission.insert',
      'collection',
      'docId',
    ]);
  }
}

export default ModelPermission;

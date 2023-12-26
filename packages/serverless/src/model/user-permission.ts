import { ObjectId } from 'mongodb';
import { ZKDATABASE_USER_PERMISSION_COLLECTION } from './abstract/database-engine';
import ModelCollection from './collection';
import { ModelGeneral } from './general';
import { UserPermission } from '../common/permission';
import ModelUserGroup from './user-group';

export type GroupPermissionSchema = {
  username: string;
  groupId: ObjectId;
  collection: string;
  docId: ObjectId;
  createdAt: Date;
  updatedAt: Date;
} & UserPermission;

export class ModelGroupPermission extends ModelGeneral {
  constructor(databaseName: string) {
    super(databaseName, ZKDATABASE_USER_PERMISSION_COLLECTION);
  }

  // @dev: Do we need to do map reduce here?
  public async getPermission(
    actor: string,
    docId: ObjectId,
    collection: string
  ): Promise<UserPermission> {
    const modelUserGroup = new ModelUserGroup(this.databaseName!);
    const permission = await this.findOne({ docId, collection });
    if (permission) {
      const userGroups = await modelUserGroup.find({
        username: actor,
      });
      const actorGroupIds = userGroups.map((userGroup) => userGroup.groupId);
      if (permission.username === actor) {
        return {
          read: permission.read,
          write: permission.write,
          delete: permission.delete,
          insert: permission.insert,
        };
      }
      // User != actor -> check for group
      if (actorGroupIds.includes(permission.groupId)) {
        const newModelGroupPermission = new ModelGroupPermission(
          this.databaseName!
        );
        const groupPermission = await newModelGroupPermission.findOne({
          _id: permission.groupId,
        });
        if (groupPermission) {
          return {
            read: groupPermission.read,
            write: groupPermission.write,
            delete: groupPermission.delete,
            insert: groupPermission.insert,
          };
        }
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

  public async create() {
    return new ModelCollection(this.databaseName, this.collectionName).create([
      'username',
      'groupId',
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

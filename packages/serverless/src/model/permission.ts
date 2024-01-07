import { ObjectId } from 'mongodb';
import { ZKDATABASE_USER_PERMISSION_COLLECTION } from '../common/const';
import ModelCollection from './collection';
import { ModelGeneral } from './general';
import { PermissionBinary, PermissionRecord } from '../common/permission';
import ModelUserGroup from './user-group';

export type PermissionSchema = {
  owner: string;
  group: string;
  ownerPermission: number;
  groupPermission: number;
  otherPermission: number;
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
      if (permission.owner === actor) {
        return PermissionBinary.fromBinaryPermission(
          permission.ownerPermission
        );
      }
      // User != actor -> check for group permission
      const modelUserGroup = new ModelUserGroup(this.databaseName!);
      const actorGroup = await modelUserGroup.listUserGroupName(actor);
      if (actorGroup.includes(permission.group)) {
        return PermissionBinary.fromBinaryPermission(
          permission.groupPermission
        );
      }
    }
    // Default deny all
    return {
      read: false,
      write: false,
      delete: false,
      insert: false,
      system: false,
    };
  }

  public static async init(databaseName: string) {
    const modelCollection = new ModelCollection(
      databaseName,
      ZKDATABASE_USER_PERMISSION_COLLECTION
    );
    await modelCollection.create([
      'owner',
      'group',
      'ownerPermission',
      'groupPermission',
      'otherPermission',
    ]);
    await modelCollection.create({ collection: 1, docId: 1 }, { unique: true });
  }
}

export default ModelPermission;

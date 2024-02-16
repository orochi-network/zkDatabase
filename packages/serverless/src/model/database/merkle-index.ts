import { ObjectId } from 'mongodb';
import {
  ZKDATABASE_MERKLE_INDEX_COLLECTION,
  ZKDATABASE_PERMISSION_COLLECTION,
} from '../../common/const';
import ModelCollection from '../abstract/collection';
import { ModelGeneral } from '../abstract/general';
import {
  PermissionBasic,
  PermissionBinary,
  PermissionRecord,
  ZKDATABASE_NO_PERMISSION_RECORD,
} from '../../common/permission';
import ModelUserGroup from './user-group';

export type PermissionSchema = PermissionBasic & {
  collection: string;
  docId: ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

export const ZKDATABASE_DEFAULT_PERMISSION: Pick<
  PermissionSchema,
  'ownerPermission' | 'groupPermission' | 'otherPermission'
> = {
  ownerPermission: 0,
  groupPermission: 0,
  otherPermission: 0,
};

export class ModelMerkleIndex extends ModelGeneral {
  static collectionName: string = ZKDATABASE_MERKLE_INDEX_COLLECTION;

  constructor(databaseName: string) {
    super(databaseName, ModelMerkleIndex.collectionName);
  }

  // @dev: Do we need to do map reduce here?
  public async getPermission(
    actor: string,
    collection: string,
    docId: ObjectId
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
      const actorGroup = await modelUserGroup.listGroupName(actor);
      if (actorGroup.includes(permission.group)) {
        return PermissionBinary.fromBinaryPermission(
          permission.groupPermission
        );
      }
    }
    // Default deny all
    return ZKDATABASE_NO_PERMISSION_RECORD;
  }
}

export default ModelMerkleIndex;

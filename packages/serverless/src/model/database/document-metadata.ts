import { FindOptions, ObjectId } from 'mongodb';
import { ZKDATABASE_METADATA_COLLECTION } from '../../common/const';
import { ModelGeneral } from '../abstract/general';
import {
  PermissionBasic,
  PermissionBinary,
  PermissionRecord,
  ZKDATABASE_NO_PERMISSION_RECORD,
} from '../../common/permission';
import ModelUserGroup from './user-group';
import ModelCollection from '../abstract/collection';

export type DocumentMetadataSchema = PermissionBasic & {
  collection: string;
  docId: ObjectId;
  merkleIndex: number;
  createdAt: Date;
  updatedAt: Date;
};

export const ZKDATABASE_DEFAULT_PERMISSION: Pick<
  DocumentMetadataSchema,
  'ownerPermission' | 'groupPermission' | 'otherPermission'
> = {
  ownerPermission: 0,
  groupPermission: 0,
  otherPermission: 0,
};

export class ModelDocumentMetadata extends ModelGeneral {
  static collectionName: string = ZKDATABASE_METADATA_COLLECTION;

  constructor(databaseName: string) {
    super(databaseName, ModelDocumentMetadata.collectionName);
  }

  public async getMaxIndex(findOpt?: FindOptions): Promise<number> {
    const maxIndexedCursor = await this.collection
      .find({}, findOpt)
      .sort({ index: -1 })
      .limit(1);
    const maxIndexedRecord: any = (await maxIndexedCursor.hasNext())
      ? await maxIndexedCursor.next()
      : { index: -1 };

    return maxIndexedRecord !== null &&
      typeof maxIndexedRecord.index === 'number'
      ? maxIndexedRecord.index
      : -1;
  }

  // @dev: Do we need to do map reduce here?
  public async getPermission(
    actor: string,
    collection: string,
    docId: ObjectId
  ): Promise<PermissionRecord> {
    const metadata = await this.findOne({ docId, collection });
    if (metadata) {
      // User == actor -> return user permission
      if (metadata.owner === actor) {
        return PermissionBinary.fromBinaryPermission(metadata.ownerPermission);
      }
      // User != actor -> check for group permission
      const modelUserGroup = new ModelUserGroup(this.databaseName!);
      const actorGroup = await modelUserGroup.listGroupByUserName(actor);
      if (actorGroup.includes(metadata.group)) {
        return PermissionBinary.fromBinaryPermission(metadata.groupPermission);
      }
    }
    // Default deny all
    return ZKDATABASE_NO_PERMISSION_RECORD;
  }

  public static async init(databaseName: string) {
    const collection = new ModelCollection(
      databaseName,
      ModelDocumentMetadata.collectionName
    );
    if (!(await collection.isExist())) {
      await collection.create({ collection: 1, docId: 1 }, { unique: true });
      await collection.create({ merkleIndex: 1 }, { unique: true });
    }
  }
}

export default ModelDocumentMetadata;

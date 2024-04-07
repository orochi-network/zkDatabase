import { FindOptions, ObjectId, Document } from 'mongodb';
import { ModelCollection, ModelGeneral, zkDatabaseConstants } from '@zkdb/storage';
import {
  PermissionBasic,
  PermissionBinary,
  PermissionRecord,
  ZKDATABASE_NO_PERMISSION_RECORD,
} from '../../common/permission';
import ModelUserGroup from './user-group';

export interface DocumentMetadataSchema extends PermissionBasic, Document {
  collection: string;
  docId: ObjectId;
  merkleIndex: number;
  createdAt: Date;
  updatedAt: Date;
}

export const ZKDATABASE_DEFAULT_PERMISSION: Pick<
  DocumentMetadataSchema,
  'permissionOwner' | 'permissionGroup' | 'permissionOther'
> = {
  permissionOwner: 0,
  permissionGroup: 0,
  permissionOther: 0,
};

export class ModelDocumentMetadata extends ModelGeneral<DocumentMetadataSchema> {
  static collectionName: string = zkDatabaseConstants.databaseCollections.permission;

  constructor(databaseName: string) {
    super(databaseName, ModelDocumentMetadata.collectionName);
  }

  public async getMaxIndex(findOpt?: FindOptions): Promise<number> {
    const maxIndexedRecord = await this.collection
      .findOne({}, { ...findOpt, sort: { merkleIndex: -1 } });
  
    return typeof maxIndexedRecord?.merkleIndex === 'number' ? maxIndexedRecord.merkleIndex : -1;
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
        return PermissionBinary.fromBinaryPermission(metadata.permissionOwner);
      }
      // User != actor -> check for group permission
      const modelUserGroup = new ModelUserGroup(this.databaseName!);
      const actorGroup = await modelUserGroup.listGroupByUserName(actor);
      if (actorGroup.includes(metadata.group)) {
        return PermissionBinary.fromBinaryPermission(metadata.permissionGroup);
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

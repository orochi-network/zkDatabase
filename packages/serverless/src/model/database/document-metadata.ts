import { Document } from 'mongodb';
import {
  ModelCollection,
  ModelGeneral,
  zkDatabaseConstants,
} from '@zkdb/storage';
import { PermissionBasic } from '../../common/permission.js';

export interface DocumentMetadataSchema extends PermissionBasic, Document {
  collection: string;
  docId: string;
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
  static collectionName: string =
    zkDatabaseConstants.databaseCollections.permission;

  constructor(databaseName: string) {
    super(databaseName, ModelDocumentMetadata.collectionName);
  }

  public static async init(databaseName: string) {
    const collection = new ModelCollection(
      databaseName,
      ModelDocumentMetadata.collectionName
    );
    if (!(await collection.isExist())) {
      await collection.index({ collection: 1, docId: 1 }, { unique: true });
      await collection.index({ merkleIndex: 1 }, { unique: true });
    }
  }
}

export default ModelDocumentMetadata;

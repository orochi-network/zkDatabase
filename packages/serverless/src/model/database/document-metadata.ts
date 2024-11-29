import {
  DB,
  ModelCollection,
  ModelGeneral,
  zkDatabaseConstants,
} from '@zkdb/storage';
import { Document } from 'mongodb';
import { PermissionBasic } from '../../common/types.js';

export interface DocumentMetadataSchema extends PermissionBasic, Document {
  collection: string;
  docId: string;
  merkleIndex: number;
  createdAt: Date;
  updatedAt: Date;
}

export class ModelDocumentMetadata extends ModelGeneral<DocumentMetadataSchema> {
  static collectionName: string =
    zkDatabaseConstants.databaseCollections.permission;

  constructor(databaseName: string) {
    super(databaseName, DB.service, ModelDocumentMetadata.collectionName);
  }

  public static async init(databaseName: string) {
    const collection = new ModelCollection(
      databaseName,
      DB.service,
      ModelDocumentMetadata.collectionName
    );
    if (!(await collection.isExist())) {
      await collection.index({ collection: 1, docId: 1 }, { unique: true });
      await collection.index({ merkleIndex: 1 }, { unique: true });
    }
  }
}

export default ModelDocumentMetadata;

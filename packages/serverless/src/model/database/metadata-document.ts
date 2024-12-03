import { TMetadataDocument } from '@zkdb/common';
import {
  DB,
  ModelCollection,
  ModelGeneral,
  zkDatabaseConstants,
} from '@zkdb/storage';
import { Document } from 'mongodb';

export interface IMetadataDocument extends Document, TMetadataDocument {}

export class ModelMetadataDocument extends ModelGeneral<IMetadataDocument> {
  static collectionName: string =
    zkDatabaseConstants.databaseCollections.metadataDocument;

  constructor(databaseName: string) {
    super(databaseName, DB.service, ModelMetadataDocument.collectionName);
  }

  public static async init(databaseName: string) {
    const collection = new ModelCollection(
      databaseName,
      DB.service,
      ModelMetadataDocument.collectionName
    );
    if (!(await collection.isExist())) {
      await collection.index({ collection: 1, docId: 1 }, { unique: true });
      await collection.index({ merkleIndex: 1 }, { unique: true });
    }
  }
}

export default ModelMetadataDocument;

import { TMetadataDocument } from '@zkdb/common';
import {
  DB,
  ModelCollection,
  ModelGeneral,
  zkDatabaseConstant,
} from '@zkdb/storage';
import { ClientSession, Document } from 'mongodb';

export interface IMetadataDocument extends Document, TMetadataDocument {}

export class ModelMetadataDocument extends ModelGeneral<IMetadataDocument> {
  static collectionName: string =
    zkDatabaseConstant.databaseCollection.metadataDocument;

  constructor(databaseName: string) {
    super(databaseName, DB.service, ModelMetadataDocument.collectionName);
  }

  public static async init(databaseName: string, session?: ClientSession) {
    const collection = new ModelCollection(
      databaseName,
      DB.service,
      ModelMetadataDocument.collectionName
    );
    if (!(await collection.isExist())) {
      await collection.index(
        { collection: 1, docId: 1 },
        { unique: true, session }
      );
      await collection.index({ merkleIndex: 1 }, { unique: true, session });
    }
  }
}

export default ModelMetadataDocument;

import { TMetadataDocumentRecord } from '@zkdb/common';
import {
  DB,
  ModelCollection,
  ModelGeneral,
  zkDatabaseConstant,
} from '@zkdb/storage';
import { WithoutId } from 'mongodb';

export class ModelMetadataDocument extends ModelGeneral<
  WithoutId<TMetadataDocumentRecord>
> {
  static collectionName: string =
    zkDatabaseConstant.databaseCollection.metadataDocument;

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

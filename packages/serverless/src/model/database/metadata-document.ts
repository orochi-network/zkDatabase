import { TMetadataDocumentRecord } from '@zkdb/common';
import {
  addTimestampMongoDB,
  DB,
  ModelCollection,
  ModelGeneral,
  zkDatabaseConstant,
} from '@zkdb/storage';
import { ClientSession, WithoutId } from 'mongodb';

export class ModelMetadataDocument extends ModelGeneral<
  WithoutId<TMetadataDocumentRecord>
> {
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

      await addTimestampMongoDB(collection, session);
    }
  }
}

export default ModelMetadataDocument;

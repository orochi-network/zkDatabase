import { TDocumentMetadataRecord } from '@zkdb/common';
import {
  DATABASE_ENGINE,
  ModelCollection,
  ModelGeneral,
  zkDatabaseConstant,
} from '@zkdb/storage';
import { ClientSession, WithoutId } from 'mongodb';

export class ModelMetadataDocument extends ModelGeneral<
  WithoutId<TDocumentMetadataRecord>
> {
  static collectionName: string =
    zkDatabaseConstant.databaseCollection.metadataDocument;

  constructor(databaseName: string) {
    super(
      databaseName,
      DATABASE_ENGINE.serverless,
      ModelMetadataDocument.collectionName
    );
  }

  public static async init(databaseName: string, session?: ClientSession) {
    const collection = new ModelCollection(
      databaseName,
      DATABASE_ENGINE.serverless,
      ModelMetadataDocument.collectionName
    );

    /*
      docId: string;
      merkleIndex: string;
      owner: string;
      group: string;
      permission: number;
      collectionName: string;
      createdAt: Date;
      updatedAt: Date;
    */
    if (!(await collection.isExist())) {
      await collection.createSystemIndex(
        { collection: 1, docId: 1 },
        { unique: true, session }
      );
      await collection.createSystemIndex(
        { merkleIndex: 1 },
        { unique: true, session }
      );

      await collection.addTimestampMongoDb({ session });
    }
  }
}

export default ModelMetadataDocument;

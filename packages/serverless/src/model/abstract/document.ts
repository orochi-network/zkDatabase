/* eslint-disable no-await-in-loop */
// eslint-disable-next-line max-classes-per-file
import {
  TSchemaSerializedField,
  TDocumentField,
  TDocumentRecordNullable,
} from '@zkdb/common';
import {
  addTimestampMongoDB,
  DATABASE_ENGINE,
  ModelCollection,
  ModelGeneral,
  ModelMetadataDatabase,
} from '@zkdb/storage';
import { randomUUID } from 'crypto';
import {
  ClientSession,
  Filter,
  InsertOneResult,
  ObjectId,
  OptionalId,
} from 'mongodb';
import { getCurrentTime, logger } from '@helper';

/**
 * ModelDocument is a class that extends ModelBasic.
 * ModelDocument handle document of zkDatabase with index hook.
 */
export class ModelDocument extends ModelGeneral<
  OptionalId<TDocumentRecordNullable>
> {
  public static instances = new Map<string, ModelDocument>();

  private constructor(databaseName: string, collectionName: string) {
    super(databaseName, DATABASE_ENGINE.serverless, collectionName);
  }

  // TODO: need manual testing to see if this is working
  public static async init(
    databaseName: string,
    collectionName: string,
    session?: ClientSession
  ) {
    const collection = new ModelCollection(
      databaseName,
      DATABASE_ENGINE.serverless,
      collectionName
    );

    if (!(await collection.isExist())) {
      await collection.index({ docId: 1, active: 1 }, { session });

      await addTimestampMongoDB(collection, session);
    }
  }

  get modelDatabase() {
    return ModelMetadataDatabase.getInstance();
  }

  get modelCollection() {
    return ModelCollection.getInstance(
      this.databaseName!,
      DATABASE_ENGINE.serverless,
      this.collectionName!
    );
  }

  public static getInstance(databaseName: string, collectionName: string) {
    const key = `${databaseName}.${collectionName}`;
    if (!ModelDocument.instances.has(key)) {
      ModelDocument.instances.set(
        key,
        new ModelDocument(databaseName, collectionName)
      );
    }
    return ModelDocument.instances.get(key)!;
  }

  /** Construct a document with fields and insert it to the collection, marking
   * it as active. If `oldDocument` is provided, the docId will be reused and
   * the new document will have reference to the old one. */
  public async insertOneFromListField(
    listField: Record<string, TSchemaSerializedField>,
    oldDocument?: {
      docId: string;
      _id: ObjectId;
    },
    session?: ClientSession
  ): Promise<[InsertOneResult<TDocumentRecordNullable>, string]> {
    const insertingDocId = oldDocument?.docId || randomUUID();
    return [
      await this.insertOne(
        {
          document: listField,
          docId: insertingDocId,
          active: true,
          createdAt: getCurrentTime(),
          updatedAt: getCurrentTime(),
          previousObjectId: oldDocument?._id || null,
        },
        {
          session,
        }
      ),
      insertingDocId,
    ];
  }

  /** Update a document by creating a new revision and setting the old one to
   * inactive. */
  public async update(
    docId: string,
    fields: Record<string, TDocumentField>,
    session: ClientSession
  ) {
    logger.debug(`ModelDocument::updateDocument()`, { docId });
    const document = await this.findOne({ docId, active: true }, { session });

    if (document) {
      // Insert new document
      const documentUpdated = await this.insertOneFromListField(
        fields,
        {
          docId: document.docId,
          _id: document._id,
        },
        session
      );

      // Set old document to active: false
      // Point the nextId to updated document to keep track history
      await this.collection.findOneAndUpdate(
        { _id: document._id },
        {
          $set: { active: false },
        },
        {
          session,
        }
      );

      return documentUpdated;
    }

    throw new Error('No document found to update');
  }

  public async countActiveDocuments(filter?: Filter<TDocumentRecordNullable>) {
    return this.collection.countDocuments({ ...filter, active: true });
  }
}

export default ModelDocument;

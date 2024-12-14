/* eslint-disable no-await-in-loop */
// eslint-disable-next-line max-classes-per-file
import {
  TContractSchemaField,
  TDocumentField,
  TDocumentRecordNullable,
} from '@zkdb/common';
import {
  DATABASE_ENGINE,
  ModelBasic,
  ModelCollection,
  ModelMetadataDatabase,
} from '@zkdb/storage';
import { randomUUID } from 'crypto';
import { ClientSession, Filter, OptionalId } from 'mongodb';
import { getCurrentTime } from '../../helper/common.js';
import logger from '../../helper/logger.js';

/**
 * ModelDocument is a class that extends ModelBasic.
 * ModelDocument handle document of zkDatabase with index hook.
 */
export class ModelDocument extends ModelBasic<
  OptionalId<TDocumentRecordNullable>
> {
  public static instances = new Map<string, ModelDocument>();

  private constructor(databaseName: string, collectionName: string) {
    super(databaseName, DATABASE_ENGINE.serverless, collectionName);
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
   * it as active */
  public async insertOneFromFields(
    fields: Record<string, TContractSchemaField>,
    docId?: string,
    session?: ClientSession
  ): Promise<TDocumentRecordNullable> {
    return this.insertOne(
      {
        document: fields,
        docId: docId || randomUUID(),
        active: true,
        createdAt: getCurrentTime(),
        updatedAt: getCurrentTime(),
        previousObjectId: null,
      },
      session
    );
  }

  public async insertOne(
    doc: OptionalId<TDocumentRecordNullable>,
    session?: ClientSession
  ): Promise<TDocumentRecordNullable> {
    logger.debug(`Inserting document to collection`, { doc });
    const result = await this.collection.insertOne(doc, { session });

    if (result.acknowledged) {
      return {
        ...doc,
        _id: doc._id || result.insertedId,
      };
    }

    throw Error('Error occurred when inserting document');
  }

  /** Update a document by creating a new revision and setting the old one to
   * inactive. */
  public async updateOne(
    docId: string,
    fields: Record<string, TDocumentField>,
    session: ClientSession
  ) {
    logger.debug(`ModelDocument::updateDocument()`, { docId });
    const findDocument = await this.findOne({ docId });

    if (findDocument) {
      // Insert new document
      const documentUpdated = await this.insertOneFromFields(
        fields,
        findDocument.docId,
        session
      );

      // Set old document to active: false
      // Point the nextId to updated document to keep track history
      await this.collection.findOneAndUpdate(
        { _id: findDocument._id },
        {
          $set: { active: false, nextId: documentUpdated._id },
        },
        {
          session,
        }
      );

      return documentUpdated;
    }

    throw new Error('No documents found to update');
  }

  public async dropOne(docId: string, session?: ClientSession) {
    logger.debug(`ModelDocument::drop()`, { docId });
    const findDocument = await this.find({ docId });

    const docIds = findDocument.map((doc) => doc.docId);

    // eslint-disable-next-line @typescript-eslint/no-shadow
    const bulkOps = docIds.map((docId) => ({
      updateMany: {
        filter: { docId },
        update: {
          $set: {
            active: false,
          },
        },
      },
    }));

    // Execute the bulk update
    const result = await this.collection.bulkWrite(bulkOps, { session });

    logger.debug(
      `ModelDocument::drop() - All versions of documents soft deleted`,
      { result }
    );

    return result;
  }

  public async findOne(filter: Filter<any>, session?: ClientSession) {
    logger.debug(`ModelDocument::findOne()`, { filter });
    return this.collection.findOne(
      { ...filter, active: true },
      {
        sort: { updatedAt: -1 },
        session,
      }
    );
  }

  public async findHistoryOne(docId: string, session?: ClientSession) {
    const documents = this.find({ docId }, session);
    return documents;
  }

  public async find(filter?: Filter<any>, session?: ClientSession) {
    logger.debug(`ModelDocument::find()`, { filter });
    return this.collection.find(filter || {}, { session }).toArray();
  }

  public async countActiveDocuments(filter?: Filter<any>) {
    return this.collection.countDocuments({ ...filter, active: true });
  }
}

export default ModelDocument;

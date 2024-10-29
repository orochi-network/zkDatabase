/* eslint-disable no-await-in-loop */
// eslint-disable-next-line max-classes-per-file
import { DB, ModelBasic, ModelCollection, ModelDatabase } from '@zkdb/storage';
import { randomUUID } from 'crypto';
import { ClientSession, Document, Filter, ObjectId } from 'mongodb';
import { PermissionBasic } from '../../common/permission.js';
import logger from '../../helper/logger.js';
import { SchemaField } from '../database/collection-metadata.js';

export type DocumentField = Pick<SchemaField, 'name' | 'kind' | 'value'>;

export type DocumentPermission = Pick<
  PermissionBasic,
  'permissionOwner' | 'permissionGroup' | 'permissionOther'
>;

export type DocumentRecord = Document & {
  _id?: ObjectId;
  docId: string;
  active: boolean;
  nextId?: ObjectId;
  timestamp?: Date;
} & {
  [key: string]: DocumentField;
};

/**
 * ModelDocument is a class that extends ModelBasic.
 * ModelDocument handle document of zkDatabase with index hook.
 */
export class ModelDocument extends ModelBasic<DocumentRecord> {
  public static instances = new Map<string, ModelDocument>();

  private constructor(databaseName: string, collectionName: string) {
    super(databaseName, DB.service, collectionName, {
      timeseries: {
        timeField: 'timestamp',
        granularity: 'seconds',
      },
    });
  }

  get modelDatabase() {
    return ModelDatabase.getInstance(this.databaseName);
  }

  get modelCollection() {
    return ModelCollection.getInstance(
      this.databaseName!,
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

  public async insertOne(document: DocumentRecord, session?: ClientSession) {
    logger.debug(`ModelDocument::updateDocument()`);
    const documentRecord = {
      timestamp: new Date(),
      ...document,
      docId: randomUUID(),
      active: true,
    } as DocumentRecord;

    const result = await this.collection.insertOne(documentRecord, { session });

    if (result.acknowledged) {
      return documentRecord;
    }

    throw Error('Error occurred when inserting document');
  }

  public async updateOne(
    docId: string,
    document: DocumentRecord,
    session: ClientSession
  ) {
    logger.debug(`ModelDocument::updateDocument()`, { docId });
    const findDocument = await this.findOne({ docId });

    if (findDocument) {
      const documentRecord = {
        timestamp: new Date(),
        ...document,
        docId: findDocument.docId,
        active: true,
      } as DocumentRecord;
      // Insert new document
      const documentUpdated = await this.collection.insertOne(documentRecord, {
        session,
      });
      // Set old document to active: false
      // Point the nextId to updated document to keep track history
      await this.collection.findOneAndUpdate(
        { _id: findDocument._id },
        {
          $set: { active: false, nextId: documentUpdated.insertedId },
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
        sort: { timestamp: -1 },
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

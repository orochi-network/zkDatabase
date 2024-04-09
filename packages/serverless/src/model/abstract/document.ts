/* eslint-disable no-await-in-loop */
// eslint-disable-next-line max-classes-per-file
import {
  ClientSession,
  Filter,
  ObjectId,
  Document,
} from 'mongodb';
import {
  ModelBasic,
  ModelDatabase,
  ModelCollection,
} from '@zkdb/storage';
import logger from '../../helper/logger';
import {SchemaField } from '../database/schema';
import { PermissionBasic } from '../../common/permission';

export type DocumentField = Pick<SchemaField, 'name' | 'kind' | 'value'>;

export type DocumentPermission = Pick<
  PermissionBasic,
  'permissionOwner' | 'permissionGroup' | 'permissionOther'
>;

export type DocumentRecord = Document & {
  _id?: ObjectId;
} & {
  [key: string]: DocumentField;
};

/**
 * ModelDocument is a class that extends ModelBasic.
 * ModelDocument handle document of zkDatabase with index hook.
 */
export class ModelDocument extends ModelBasic<DocumentRecord> {
  public static instances = new Map<string, ModelDocument>();


  get modelDatabase() {
    return ModelDatabase.getInstance(this.databaseName!);
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

  public async insertDocument(
    document: DocumentRecord,
    session?: ClientSession
  ) {
    logger.debug(`ModelDocument::updateDocument()`, { filter });
    return this.collection.insertOne(document, { session });
  }

  public async updateDocument(
    filter: Filter<any>,
    document: DocumentRecord,
    session?: ClientSession
  ) {
    logger.debug(`ModelDocument::updateDocument()`, { filter });
    return this.collection.updateMany(filter, { $set: document }, { session });
  }

  public async findOne(filter: Filter<any>, session?: ClientSession) {
    logger.debug(`ModelDocument::findOne()`, { filter });
    return this.collection.findOne(filter, { session });
  }

  public async find(filter?: Filter<any>, session?: ClientSession) {
    logger.debug(`ModelDocument::find()`, { filter });
    return this.collection.find(filter || {}, { session }).toArray();
  }

  public async drop(filter: Filter<any>, session?: ClientSession) {
    logger.debug(`ModelDocument::drop()`, { filter });
    return this.collection.deleteMany(filter || {}, { session });
  }
}

export default ModelDocument;

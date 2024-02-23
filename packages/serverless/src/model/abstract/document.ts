/* eslint-disable no-await-in-loop */
import {
  ClientSession,
  Filter,
  InsertOneResult,
  UpdateFilter,
  Document,
  ObjectId,
} from 'mongodb';
import ModelBasic from './basic';
import logger from '../../helper/logger';
import {
  ZKDATABAES_USER_SYSTEM,
  ZKDATABASE_GROUP_SYSTEM,
} from '../../common/const';
import { ModelDocumentMetadata } from '../database/document-metadata';
import { ModelSchema, SchemaField } from '../database/schema';
import ModelDatabase from './database';
import ModelCollection from './collection';
import { getCurrentTime } from '../../helper/common';
import ModelMerkleTreePool from '../database/merkle-tree-pool';
import { PermissionBasic } from '../../common/permission';

export type DocumentField = Pick<SchemaField, 'name' | 'kind' | 'value'>;

export type DocumentPermission = Pick<
  PermissionBasic,
  'permissionOwner' | 'permissionGroup' | 'permissionOther'
>;

export interface DocumentRecord extends Document {
  [key: string]: DocumentField;
}

/**
 * ModelDocument is a class that extends ModelBasic.
 * ModelDocument handle document of zkDatabase with index hook.
 */
export class ModelDocument extends ModelBasic<DocumentRecord> {
  private merkleTreePool: ModelMerkleTreePool;

  public static instances = new Map<string, ModelDocument>();

  private constructor(databaseName: string, collectionName: string) {
    super(databaseName, collectionName);
    this.merkleTreePool = ModelMerkleTreePool.getInstance(databaseName);
  }

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
      const merkleTreePool = ModelMerkleTreePool.getInstance(databaseName);
      ModelDocument.instances.set(
        key,
        new ModelDocument(databaseName, collectionName)
      );
    }
    return ModelDocument.instances.get(key)!;
  }

  public async getDocumentDetail(documentId: ObjectId) {
    const modelSchema = ModelSchema.getInstance(this.databaseName!);
    const schema = await modelSchema.findOne({
      collection: this.collectionName,
    });
    const document = await this.findOne({ _id: documentId });
    if (schema !== null && document !== null) {
      for (let i = 0; i < schema.fields.length; i += 1) {
        const field = schema.fields[i];
        const { kind } = schema[field].kind;
        const value = document[field].value;
      }
      return { documentMetadata, schema };
    }
  }

  public async updateOne(
    filter: Filter<DocumentRecord>,
    update: UpdateFilter<DocumentRecord>
  ): Promise<boolean> {
    let updated = false;
    await this.withTransaction(async (session: ClientSession) => {
      const oldRecord = await this.collection.findOne(filter, { session });
      if (oldRecord === null) {
        throw new Error('Record not found');
      }
      // @todo I think we need to make sure that the update is valid
      // - We need to check the schema
      // - We need to check for permission
      // - We need to check for the index in document metadata
      // - Update the merkle tree
      const result = await this.collection.updateMany(filter, update, {
        session,
      });
      // We need to do this to make sure that only 1 record
      if (1 === result.modifiedCount) {
        updated = true;
      } else {
        await session.abortTransaction();
      }
    });
    return updated;
  }

  public async insertOne(
    documentRecord: DocumentRecord,
    documentPermission: Partial<DocumentPermission> = {}
  ) {
    let insertResult;
    const success = await this.withTransaction(
      async (session: ClientSession) => {
        const modelSchema = ModelSchema.getInstance(this.databaseName!);
        const modelDocumentMetadata = new ModelDocumentMetadata(
          this.databaseName!
        );
        const index =
          (await modelDocumentMetadata.getMaxIndex({ session })) + 1;

        // Insert document to collection
        const insertResult = await this.collection.insertOne(documentRecord, {
          session,
        });

        const documentSchema = await modelSchema.findOne(
          {
            collection: this.collectionName,
          },
          { session }
        );

        if (documentSchema === null) {
          throw new Error('Schema not found');
        }

        if (ModelSchema.validate(documentSchema, documentRecord)) {
          throw new Error('Invalid document schema');
        }

        const { permissionOwner, permissionGroup, permissionOther } =
          documentSchema;

        // Insert document metadata
        await modelDocumentMetadata.insertOne(
          {
            collection: this.collectionName!,
            docId: insertResult.insertedId,
            merkleIndex: index,
            ...{
              permissionOwner,
              permissionGroup,
              permissionOther,
              // I'm set these to system user and group as default
              // In case this permission don't override by the user
              // this will prevent the user from accessing the data
              group: ZKDATABASE_GROUP_SYSTEM,
              owner: ZKDATABAES_USER_SYSTEM,
            },
            // Overwrite inherited permission with the new one
            ...documentPermission,
            createdAt: getCurrentTime(),
            updatedAt: getCurrentTime(),
          },
          { session }
        );
      }
    );
    return success ? insertResult : null;
  }

  public async findOne(filter: Filter<any>) {
    logger.debug(`ModelDocument::findOne()`, { filter });
    return this.collection.findOne(filter);
  }

  public async find(filter?: Filter<any>) {
    logger.debug(`ModelDocument::find()`, { filter });
    return this.collection.find(filter || {}).toArray();
  }

  public async drop(filter: Filter<any>) {
    // @dev: We need to drop the metadata first
    // And merkle tree index and other related data
  }
}

export default ModelDocument;

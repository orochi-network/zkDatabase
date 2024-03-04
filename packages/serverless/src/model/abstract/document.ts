/* eslint-disable no-await-in-loop */
// eslint-disable-next-line max-classes-per-file
import { ClientSession, Filter, UpdateResult, ObjectId } from 'mongodb';
import ModelBasic from './basic';
import logger from '../../helper/logger';
import {
  ZKDATABASE_USER_SYSTEM,
  ZKDATABASE_GROUP_SYSTEM,
} from '../../common/const';
import { ModelDocumentMetadata } from '../database/document-metadata';
import { ModelSchema, SchemaField } from '../database/schema';
import ModelDatabase from './database';
import ModelCollection from './collection';
import { getCurrentTime } from '../../helper/common';
import { PermissionBasic } from '../../common/permission';
import { SchemaEncoded, Schema, ProvableTypeString } from '../common/schema';
import { ProvableTypeMap } from '../../common/schema';
import ModelMerkleTree from '../database/merkle-tree';

export type DocumentField = Pick<SchemaField, 'name' | 'kind' | 'value'>;

export type DocumentPermission = Pick<
  PermissionBasic,
  'permissionOwner' | 'permissionGroup' | 'permissionOther'
>;

export type DocumentRecord = DocumentField[];

/**
 * ModelDocument is a class that extends ModelBasic.
 * ModelDocument handle document of zkDatabase with index hook.
 */
export class ModelDocument extends ModelBasic<DocumentRecord> {
  private merkleTree: ModelMerkleTree;

  public static instances = new Map<string, ModelDocument>();

  private constructor(databaseName: string, collectionName: string) {
    super(databaseName, collectionName);
    this.merkleTree = ModelMerkleTree.getInstance(databaseName);
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
      ModelDocument.instances.set(
        key,
        new ModelDocument(databaseName, collectionName)
      );
    }
    return ModelDocument.instances.get(key)!;
  }

  public async getDocumentDetail(
    documentId: ObjectId,
    session?: ClientSession
  ) {
    const modelSchema = ModelSchema.getInstance(this.databaseName!);
    const schema = await modelSchema.findOne(
      {
        collection: this.collectionName,
      },
      { session }
    );
    const encodedDocument: SchemaEncoded = [];
    const structType: { [key: string]: any } = {};
    const document = await this.collection.findOne(
      { _id: documentId },
      { session }
    );

    if (schema !== null && document !== null) {
      for (let i = 0; i < schema.fields.length; i += 1) {
        const schemaField = schema.fields[i];
        const { name, kind, value } = document[i];
        if (
          schema[schemaField].name !== name &&
          schema[schemaField].kind !== kind
        ) {
          throw new Error('Invalid formatted document');
        }
        structType[name] = ProvableTypeMap[name as ProvableTypeString];
        encodedDocument.push([name, kind, value]);
      }
      const structuredSchema = Schema.create(structType);
      structuredSchema.deserialize(encodedDocument).hash();
      return {
        schema,
        document,
        structuredSchema,
        structuredDocument: structuredSchema.deserialize(encodedDocument),
      };
    }
    return null;
  }

  public async updateOne(
    filter: Filter<DocumentRecord>,
    update: DocumentRecord
  ): Promise<UpdateResult<DocumentRecord> | null> {
    let updateResult: UpdateResult<DocumentRecord> | null = null;
    const success = await this.withTransaction(
      async (session: ClientSession) => {
        const modelSchema = ModelSchema.getInstance(this.databaseName!);
        const schema = await modelSchema.findOne(
          {
            collection: this.collectionName,
          },
          { session }
        );
        // Schema not found
        if (schema === null) {
          throw new Error('Schema not found');
        }
        // Validate the update
        if (!ModelSchema.validateUpdate(schema, update)) {
          throw new Error('Invalid update, schema validation failed');
        }

        // Update the document
        updateResult = await this.collection.updateMany(
          filter,
          { $set: update },
          {
            session,
          }
        );

        // We need to do this to make sure that only 1 record
        if (
          (updateResult.modifiedCount !== 1 &&
            updateResult.matchedCount !== 1) ||
          !updateResult
        ) {
          throw new Error('Invalid update, modified count not equal to 1');
        }

        const documentDetails = await this.getDocumentDetail(
          updateResult.upsertedId!
        );

        if (!documentDetails) {
          throw Error('Document details is empty');
        }

        const newHash = documentDetails.structuredDocument.hash();

        const modelDocumentMetadata = new ModelDocumentMetadata(
          this.databaseName!
        );

        const documentMetadata = await modelDocumentMetadata.findOne(
          { docId: updateResult.upsertedId! },
          { session }
        );

        if (!documentMetadata) {
          throw Error('Document metadata is empty');
        }

        await this.merkleTree.setLeaf(
          BigInt(documentMetadata.merkleIndex),
          newHash,
          new Date(),
          {
            session,
          }
        );
      }
    );
    return success ? updateResult : null;
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

        if (ModelSchema.validateDocument(documentSchema, documentRecord)) {
          throw new Error('Invalid document schema');
        }

        const { permissionOwner, permissionGroup, permissionOther } =
          documentSchema;

        // Insert document metadata
        const document = await modelDocumentMetadata.insertOne(
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
              owner: ZKDATABASE_USER_SYSTEM,
            },
            // Overwrite inherited permission with the new one
            ...documentPermission,
            createdAt: getCurrentTime(),
            updatedAt: getCurrentTime(),
          },
          { session }
        );

        const documentDetails = await this.getDocumentDetail(
          document.insertedId
        );

        if (!documentDetails) {
          throw Error('Document details is empty');
        }

        const newHash = documentDetails.structuredDocument.hash();

        await this.merkleTree.setLeaf(BigInt(index), newHash, new Date(), {
          session,
        });
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

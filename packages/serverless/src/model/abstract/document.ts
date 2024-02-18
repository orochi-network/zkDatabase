/* eslint-disable no-await-in-loop */
import {
  ClientSession,
  Filter,
  InsertOneResult,
  OptionalUnlessRequiredId,
  UpdateFilter,
  Document,
} from 'mongodb';
import ModelBasic from './basic';
import logger from '../../helper/logger';
import {
  ZKDATABAES_GROUP_NOBODY,
  ZKDATABAES_USER_NOBODY,
} from '../../common/const';
import {
  ModelDocumentMetadata,
  DocumentMetadataSchema,
} from '../database/document-metadata';
import { ZKDATABASE_NO_PERMISSION_BIN } from '../../common/permission';
import { ModelSchema } from '../database/schema';
import ModelDatabase from './database';
import ModelCollection from './collection';

/**
 * ModelDocument is a class that extends ModelBasic.
 * ModelDocument handle document of zkDatabase with index hook.
 */
export class ModelDocument extends ModelBasic {
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
      ModelDocument.instances.set(key, new ModelDocument(key));
    }
    return ModelDocument.instances.get(key)!;
  }

  public async updateOne(
    filter: Filter<Document>,
    update: UpdateFilter<Document>
  ): Promise<boolean> {
    let updated = false;
    await this.withTransaction(async (session: ClientSession) => {
      const oldRecord = await this.collection.findOne(filter, { session });
      if (oldRecord !== null) {
      }
      const result = await this.collection.updateMany(
        filter,
        {
          $set: {
            ...update,
          },
        },
        {
          session,
        }
      );
      // We need to do this to make sure that only 1 record
      if (result.modifiedCount === 1) {
        updated = true;
      } else {
        await session.abortTransaction();
      }
    });
    return updated;
  }

  public async insertOne<T extends any>(
    data: OptionalUnlessRequiredId<T>,
    inheritPermission: Partial<DocumentMetadataSchema>
  ) {
    let insertResult;
    await this.withTransaction(async (session: ClientSession) => {
      const modelSchema = ModelSchema.getInstance(this.databaseName!);
      const modelDocumentMetadata = new ModelDocumentMetadata(
        this.databaseName!
      );
      const index = (await modelDocumentMetadata.getMaxIndex()) + 1;
      const result: InsertOneResult<Document> = await this.collection.insertOne(
        data,
        { session }
      );

      const basicCollectionPermission = await modelSchema.collection.findOne(
        {
          collection: this.collectionName,
          docId: null,
        },
        { session }
      );

      const {
        ownerPermission,
        groupPermission,
        otherPermission,
        group,
        owner,
      } =
        basicCollectionPermission !== null
          ? basicCollectionPermission
          : {
              owner: ZKDATABAES_USER_NOBODY,
              group: ZKDATABAES_GROUP_NOBODY,
              ownerPermission: ZKDATABASE_NO_PERMISSION_BIN,
              groupPermission: ZKDATABASE_NO_PERMISSION_BIN,
              otherPermission: ZKDATABASE_NO_PERMISSION_BIN,
            };

      await modelDocumentMetadata.insertOne({
        collection: this.collectionName!,
        docId: result.insertedId,
        fmerkleIndex: index,
        ...{ ownerPermission, groupPermission, otherPermission, group, owner },
        ...inheritPermission,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    });
    return insertResult;
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

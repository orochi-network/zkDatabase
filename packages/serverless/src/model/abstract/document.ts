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
  ZKDATABAES_USER_SYSTEM,
  ZKDATABASE_GROUP_SYSTEM,
} from '../../common/const';
import {
  ModelDocumentMetadata,
  DocumentMetadataSchema,
} from '../database/document-metadata';
import { ZKDATABASE_NO_PERMISSION_BIN } from '../../common/permission';
import { ModelSchema } from '../database/schema';
import ModelDatabase from './database';
import ModelCollection from './collection';
import { getCurrentTime } from '../../helper/common';
import ModelMerkleTreePool from '../merkle-tree-pool';

/**
 * ModelDocument is a class that extends ModelBasic.
 * ModelDocument handle document of zkDatabase with index hook.
 */
export class ModelDocument<T extends Document> extends ModelBasic<T> {
  private merkleTreePool: ModelMerkleTreePool;

  public static instances = new Map<string, ModelDocument<any>>();

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

  public async updateOne(
    filter: Filter<T>,
    update: UpdateFilter<T>
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
    data: OptionalUnlessRequiredId<T>,
    inheritPermission: Partial<DocumentMetadataSchema>
  ) {
    let insertResult;
    await this.withTransaction(async (session: ClientSession) => {
      // @todo We need to check for schema here
      const modelSchema = ModelSchema.getInstance(this.databaseName!);
      const modelDocumentMetadata = new ModelDocumentMetadata(
        this.databaseName!
      );
      const index = (await modelDocumentMetadata.getMaxIndex({ session })) + 1;
      const result: InsertOneResult<Document> = await this.collection.insertOne(
        data,
        { session }
      );

      const basicCollectionPermission = await modelSchema.findOne(
        {
          collection: this.collectionName,
        },
        { session }
      );

      const { permissionOwner, permissionGroup, permissionOther } =
        basicCollectionPermission !== null
          ? basicCollectionPermission
          : {
              permissionOwner: ZKDATABASE_NO_PERMISSION_BIN,
              permissionGroup: ZKDATABASE_NO_PERMISSION_BIN,
              permissionOther: ZKDATABASE_NO_PERMISSION_BIN,
            };

      await modelDocumentMetadata.insertOne({
        collection: this.collectionName!,
        docId: result.insertedId,
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
        ...inheritPermission,
        createdAt: getCurrentTime(),
        updatedAt: getCurrentTime(),
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

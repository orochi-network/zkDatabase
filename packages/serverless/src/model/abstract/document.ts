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
  ZKDATABASE_MERKLE_INDEX_COLLECTION,
} from '../../common/const';
import { ModelPermission, PermissionSchema } from '../database/permission';
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
    inheritPermission: Partial<PermissionSchema>
  ) {
    let insertResult;
    await this.withTransaction(async (session: ClientSession) => {
      const modelSchema = ModelSchema.getInstance(this.databaseName!);
      const modelPermission = new ModelPermission(this.databaseName!);
      const index = (await this.getMaxIndex()) + 1;
      const result: InsertOneResult<IndexedDocument> =
        await this.collection.insertOne(
          {
            [ZKDATABASE_INDEX_RECORD]: index,
            ...data,
          } as any,
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

      await modelPermission.insertOne({
        collection: this.collectionName!,
        docId: result.insertedId,
        ...{ ownerPermission, groupPermission, otherPermission, group, owner },
        ...inheritPermission,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await this.db.collection(ZKDATABASE_MERKLE_INDEX_COLLECTION).insertOne(
        {
          [ZKDATABASE_INDEX_RECORD]: index,
          collection: this.collectionName,
          link: result.insertedId,
        },
        { session }
      );
      insertResult = {
        [ZKDATABASE_INDEX_RECORD]: index,
        ...data,
      };
      logger.debug(`ModelDocument::insertOne()`, { result, insertResult });
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
    let deletedCount = 0;
    const acknowledged = await this.withTransaction(
      async (session: ClientSession) => {
        const filteredRecords = await this.collection.find(filter);
        while (await filteredRecords.hasNext()) {
          const record = await filteredRecords.next();
          if (record) {
            await this.db
              .collection(ZKDATABASE_MERKLE_INDEX_COLLECTION)
              .deleteOne(
                { [ZKDATABASE_INDEX_RECORD]: record[ZKDATABASE_INDEX_RECORD] },
                { session }
              );
            await this.collection.deleteOne({ _id: record._id }, { session });
            deletedCount += 1;
          }
        }
      }
    );
    logger.debug(`ModelDocument::drop()`, {
      filter,
      acknowledged,
      deletedCount,
    });
    return { acknowledged, deletedCount };
  }
}

export default ModelDocument;

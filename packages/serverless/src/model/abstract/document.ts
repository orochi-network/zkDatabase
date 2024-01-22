/* eslint-disable no-await-in-loop */
import {
  ClientSession,
  Filter,
  InsertOneResult,
  OptionalUnlessRequiredId,
  UpdateFilter,
  Document
} from 'mongodb';
import ModelBasic from './basic';
import { IndexedDocument } from './database-engine';
import logger from '../../helper/logger';
import {
  ZKDATABAES_GROUP_NOBODY,
  ZKDATABAES_USER_NOBODY,
  ZKDATABASE_INDEX_COLLECTION,
  ZKDATABASE_INDEX_RECORD,
} from '../../common/const';
import { ModelPermission, PermissionSchema } from '../database/permission';
import { ZKDATABASE_NO_PERMISSION_BIN } from '../../common/permission';
import { ModelSchemaManegement } from '../database/schema-management';

/**
 * ModelDocument is a class that extends ModelBasic. ModelDocument handle document of zkDatabase with index hook.
 * Index hook 
 */
export class ModelDocument extends ModelBasic {
  public static getInstance(databaseName: string, collectionName: string) {
    return new ModelDocument(databaseName, collectionName);
  }

  /**
   * Get max index value of record
   * @returns number
   */
  private async getMaxIndex(): Promise<number> {
    const maxIndexedCursor = await this.db
      .collection(ZKDATABASE_INDEX_COLLECTION)
      .find()
      .sort({ [ZKDATABASE_INDEX_RECORD]: -1 })
      .limit(1);
    const maxIndexedRecord: any = (await maxIndexedCursor.hasNext())
      ? await maxIndexedCursor.next()
      : { [ZKDATABASE_INDEX_RECORD]: -1 };

    return maxIndexedRecord !== null &&
      typeof maxIndexedRecord[ZKDATABASE_INDEX_RECORD] === 'number'
      ? maxIndexedRecord[ZKDATABASE_INDEX_RECORD]
      : -1;
  }

  /**
   * Update the first record that matched the filter
   * @note We should perform update on Merkle tree that's stored in 
   * @param filter
   * @param update 
   * @returns 
   */
  public async updateOne(filter: Filter<Document>, update: UpdateFilter<Document>): Promise<boolean> {
    let updated = false;
    await this.withTransaction(async (session: ClientSession) => {
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
      const modelSchema = ModelSchemaManegement.getInstance(this.databaseName!);
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

      await this.db.collection(ZKDATABASE_INDEX_COLLECTION).insertOne(
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
              .collection(ZKDATABASE_INDEX_COLLECTION)
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

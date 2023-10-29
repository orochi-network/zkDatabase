import {
  ClientSession,
  Filter,
  InsertOneResult,
  OptionalUnlessRequiredId,
} from 'mongodb';
import { ModelBasic } from './abstract/basic';
import {
  ZKDATABASE_INDEX_COLLECTION,
  ZKDATABASE_INDEX_RECORD,
  IndexedDocument,
} from './abstract/database-engine';

export class ModelDocument extends ModelBasic {
  private constructor(databaseName: string, collectionName: string) {
    super(databaseName, collectionName);
  }

  public static getInstance(databaseName: string, collectionName: string) {
    return new ModelDocument(databaseName, collectionName);
  }

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

  public async updateOne(filter: Filter<any>, update: any): Promise<boolean> {
    let updated = false;
    await this.withTransaction(async (session: ClientSession) => {
      const result = await this.collection.updateMany(filter, update, {
        session,
      });
      if (result.modifiedCount === 1) {
        updated = true;
      } else {
        await session.abortTransaction();
      }
    });
    return updated;
  }

  public async insertOne<T extends any>(data: OptionalUnlessRequiredId<T>) {
    await this.withTransaction(async (session: ClientSession) => {
      const index = (await this.getMaxIndex()) + 1;
      const result: InsertOneResult<IndexedDocument> =
        await this.collection.insertOne(
          {
            [ZKDATABASE_INDEX_RECORD]: index,
            ...data,
          } as any,
          { session }
        );
      await this.db.collection(ZKDATABASE_INDEX_COLLECTION).insertOne(
        {
          [ZKDATABASE_INDEX_RECORD]: index,
          collection: this.collectionName,
          link: result.insertedId,
        },
        { session }
      );
    });
  }

  public async findOne(filter: Filter<any>) {
    return this.collection.findOne(filter);
  }

  public async find(filter?: Filter<any>) {
    return this.collection.find(filter || {}).toArray();
  }
}

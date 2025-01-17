import { zkDatabaseConstant } from '@common';
import { DATABASE_ENGINE } from '@helper';
import { ESequencer, TSequencedItem } from '@zkdb/common';
import { ClientSession, WithoutId } from 'mongodb';
import { ModelBasic } from '../base';
import { ModelCollection } from '../general';

// TODO: sequence value should be bigint, not number, e.g. merkle index is bigint

export class ModelSequencer extends ModelBasic<WithoutId<TSequencedItem>> {
  public static readonly INITIAL_SEQUENCE_VALUE = 1n;
  public static readonly SEQUENCE_INCREMENT = 1n;

  private static instances = new Map<string, ModelSequencer>();

  private constructor(databaseName: string) {
    super(
      databaseName,
      DATABASE_ENGINE.serverless,
      zkDatabaseConstant.databaseCollection.sequencer
    );
  }

  /** Session is required to avoid concurrency issues such as write conflict
   * while initializing the collection (create index, etc.) and writing to the
   * collection at the same time. */
  public static async getInstance(
    databaseName: string,
    session: ClientSession
  ) {
    const key = databaseName;
    if (!ModelSequencer.instances.has(key)) {
      ModelSequencer.instances.set(key, new ModelSequencer(databaseName));
      await ModelSequencer.init(key, session);
    }
    return ModelSequencer.instances.get(key)!;
  }

  async nextValue(
    sequenceName: ESequencer,
    session?: ClientSession
  ): Promise<bigint> {
    const index = await this.collection.findOne(
      { type: sequenceName },
      { session }
    );

    if (index) {
      const updateResult = await this.collection.findOneAndUpdate(
        { type: sequenceName },
        {
          $inc: { seq: ModelSequencer.SEQUENCE_INCREMENT },
          $set: { updatedAt: new Date() },
        },
        { upsert: true, returnDocument: 'after', session }
      );

      if (!updateResult) {
        throw new Error(`Failed to increment sequence '${sequenceName}'`);
      }

      return updateResult.seq;
    } else {
      const creationTime = new Date();

      const insertResult = await this.collection.insertOne(
        {
          type: sequenceName,
          seq: ModelSequencer.INITIAL_SEQUENCE_VALUE,
          createdAt: creationTime,
          updatedAt: creationTime,
        },
        { session }
      );

      if (!insertResult.insertedId) {
        throw new Error(`Failed to create sequence '${sequenceName}'`);
      }

      return ModelSequencer.INITIAL_SEQUENCE_VALUE;
    }
  }

  async current(type: ESequencer, session?: ClientSession) {
    const index = await this.collection.findOne(
      { type },
      {
        session,
      }
    );

    return index?.seq ?? 0n;
  }

  public static async init(databaseName: string, session?: ClientSession) {
    const collection = ModelCollection.getInstance(
      databaseName,
      DATABASE_ENGINE.serverless,
      zkDatabaseConstant.databaseCollection.sequencer
    );
    if (!(await collection.isExist())) {
      await collection.createSystemIndex(
        { type: 1 },
        { unique: true, session }
      );
      await collection.addTimestampMongoDb({ session });
    }
  }
}

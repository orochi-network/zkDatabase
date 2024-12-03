import { ClientSession } from 'mongodb';
import { TSequencedItem } from '@zkdb/common';
import { zkDatabaseConstants } from '../../common/index.js';
import { DB } from '../../helper/db-instance.js';
import ModelBasic from '../base/basic.js';

export class ModelSequencer extends ModelBasic<TSequencedItem> {
  private static instances = new Map<string, ModelSequencer>();

  private constructor(databaseName: string) {
    super(
      databaseName,
      DB.service,
      zkDatabaseConstants.databaseCollections.sequencer
    );
  }

  public static getInstance(databaseName: string) {
    const key = databaseName;
    if (!ModelSequencer.instances.has(key)) {
      ModelSequencer.instances.set(key, new ModelSequencer(databaseName));
    }
    return ModelSequencer.instances.get(key)!;
  }

  async getNextValue(
    sequenceName: TSequencedItem,
    session?: ClientSession
  ): Promise<number> {
    const updateResult = await this.collection.findOneAndUpdate(
      { _id: sequenceName },
      { $inc: { seq: 1 } },
      { upsert: true, returnDocument: 'after', session }
    );

    if (!updateResult) {
      throw new Error(
        `Failed to get next value for sequence '${sequenceName}'`
      );
    }

    return updateResult.seq;
  }
}

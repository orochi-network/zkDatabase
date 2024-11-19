import { ClientSession } from 'mongodb';
import { ModelBasic } from '../base';
import { DatabaseEngine } from '../database-engine';
import { zkDatabaseConstants } from '@common';

export type Sequence = 'merkle-index' | 'operation';

export type SequencedItem = {
  _id: string;
  seq: number;
};

export class ModelSequencer extends ModelBasic<SequencedItem> {
  private static instances = new Map<string, ModelSequencer>();
  private static dbEngine: DatabaseEngine;

  private constructor(databaseName: string) {
    super(
      databaseName,
      ModelSequencer.dbEngine,
      zkDatabaseConstants.databaseCollections.sequencer
    );
  }
  public static createModel(dbEngine: DatabaseEngine) {
    ModelSequencer.dbEngine = dbEngine;
  }
  public static getInstance(databaseName: string) {
    const key = databaseName;
    if (!ModelSequencer.instances.has(key)) {
      ModelSequencer.instances.set(key, new ModelSequencer(databaseName));
    }
    return ModelSequencer.instances.get(key)!;
  }

  async getNextValue(
    sequenceName: Sequence,
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

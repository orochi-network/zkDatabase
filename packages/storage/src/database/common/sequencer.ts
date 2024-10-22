import { ClientSession } from 'mongodb';
import ModelBasic from '../base/basic.js';
import { zkDatabaseConstants } from '../../common/index.js';
import { NetworkId } from '../global/network.js';
import { DatabaseEngine } from '../database-engine.js';

export type SequencedItem = {
  _id: string;
  seq: number;
};

export class ModelSequencer extends ModelBasic<SequencedItem> {
  private static instances = new Map<string, ModelSequencer>();

  private constructor(databaseName: string) {
    super(databaseName, zkDatabaseConstants.databaseCollections.sequencer);
  }

  public static getInstance(databaseName: string, networkId: NetworkId) {
    const dbName = DatabaseEngine.getValidName(databaseName, networkId);
    if (!ModelSequencer.instances.has(dbName)) {
      ModelSequencer.instances.set(dbName, new ModelSequencer(dbName));
    }
    return ModelSequencer.instances.get(dbName)!;
  }

  async getNextValue(
    sequenceName: string,
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

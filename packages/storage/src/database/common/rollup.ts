import { ModelBasic } from '@orochi-network/framework';
import { DB } from '../../helper';
import { zkDatabaseConstants } from '../../common';
import ModelGeneral from '../base/general';

export type RollupItem = {
  txHash: string;
  status: string; // TODO: Improve status
  createdAt: string;
  merkleRoot: string;
  newMerkleRoot: string;
  databaseName: string;
  error?: string;
};

export class ModelRollup extends ModelGeneral<RollupItem> {
  private static instances = new Map<string, ModelRollup>();
  private constructor(databaseName: string) {
    super(
      databaseName,
      DB.service,
      zkDatabaseConstants.globalCollections.rollup
    );
  }

  static getInstance(databaseName: string) {
    if (!ModelRollup.instances.has(databaseName)) {
      ModelRollup.instances.set(databaseName, new ModelRollup(databaseName));
    }
    return ModelRollup.instances.get(databaseName);
  }
}

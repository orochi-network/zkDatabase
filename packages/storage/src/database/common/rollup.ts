import { ModelBasic } from '@orochi-network/framework';
import { DB } from '../../helper';
import { zkDatabaseConstants } from '../../common';
import ModelGeneral from '../base/general';

export type RollupItem = {};
export class ModelRollup extends ModelGeneral<RollupItem> {
  private instances = new Map<string, ModelRollup>();
  private constructor(databaseName: string) {
    super(
      databaseName,
      DB.service,
      zkDatabaseConstants.globalCollections.rollup
    );
  }
}

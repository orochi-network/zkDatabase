import ModelCollection from './collection';
import { ZKDATABASE_SETTING_COLLECTION } from '../common/const';
import { ModelGeneral } from './general';

export type AllConfigSchema =
  | {
      configKey: 'user_starting_group';
      configValue: string[];
    }
  | {
      configKey: 'basic_permission_group';
      configValue: string;
    };

export type SettingSchema = AllConfigSchema & {
  createdAt: Date;
  updatedAt: Date;
};

export class ModelSetting extends ModelGeneral {
  constructor(databaseName: string) {
    super(databaseName, ZKDATABASE_SETTING_COLLECTION);
  }

  public async create() {
    return new ModelCollection(this.databaseName, this.collectionName).create(
      { configKey: 1 },
      { unique: true }
    );
  }
}

export default ModelSetting;

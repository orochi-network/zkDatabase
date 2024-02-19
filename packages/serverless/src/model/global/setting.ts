import { ZKDATABASE_GLOBAL_DB } from '../../common/const';
import { ModelGeneral } from '../abstract/general';

export type DocumentAllSettings = {
  configKey: 'database_version';
  configValue: string;
};

export type DocumentSetting = DocumentAllSettings & {
  createdAt: Date;
  updatedAt: Date;
};

export class ModelSetting extends ModelGeneral {
  private isUpdated: boolean = false;
  static collectionName: string = 'setting';

  constructor() {
    super(ZKDATABASE_GLOBAL_DB, ModelSetting.collectionName);
  }

  public async load() {
    await this.find();
  }
}

export default ModelSetting;

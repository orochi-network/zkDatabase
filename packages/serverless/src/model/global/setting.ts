import { Document } from 'mongodb';
import { ZKDATABASE_GLOBAL_DB } from '../../common/const';
import { ModelGeneral } from '../abstract/general';
import ModelCollection from '../abstract/collection';

export type DocumentAllSettings = {
  configKey: 'database_version';
  configValue: string;
};

export interface DocumentSetting extends Document, DocumentAllSettings {
  createdAt: Date;
  updatedAt: Date;
}

export class ModelSetting extends ModelGeneral<DocumentSetting> {
  private isUpdated: boolean = false;
  static collectionName: string = 'setting';

  constructor() {
    super(ZKDATABASE_GLOBAL_DB, ModelSetting.collectionName);
  }

  public async load() {
    await this.find();
  }

  public static async init() {
    const collection = ModelCollection.getInstance(
      ZKDATABASE_GLOBAL_DB,
      ModelSetting.collectionName
    );
    if (!(await collection.isExist())) {
      collection.index({ owner: 1 }, { unique: true });
      collection.index({ databaseName: 1 }, { unique: true });
    }
  }
}

export default ModelSetting;

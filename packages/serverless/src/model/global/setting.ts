import { Document } from 'mongodb';
import { ModelCollection, ModelGeneral, zkDatabaseConstants } from '@zkdb/storage';

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

  private static collectionName: string = zkDatabaseConstants.globalCollections.setting;

  constructor() {
    super(zkDatabaseConstants.globalDatabase, ModelSetting.collectionName);
  }

  public async load() {
    await this.find();
  }

  public static async init() {
    const collection = ModelCollection.getInstance(
      zkDatabaseConstants.globalDatabase,
      ModelSetting.collectionName
    );
    if (!(await collection.isExist())) {
      collection.index({ owner: 1 }, { unique: true });
      collection.index({ databaseName: 1 }, { unique: true });
    }
  }
}

export default ModelSetting;

import { ZKDATABASE_DB_SETTING_COLLECTION } from '../../common/const';
import ModelBasic from '../abstract/basic';

export type DbSetting = {
  merkleHeight: number;
};

export class ModelDbSetting extends ModelBasic<DbSetting> {
  private static instances = new Map<string, ModelDbSetting>();

  private constructor(databaseName: string) {
    super(databaseName, ZKDATABASE_DB_SETTING_COLLECTION);
  }

  public static getInstance(databaseName: string) {
    const key = databaseName;
    if (!ModelDbSetting.instances.has(key)) {
      ModelDbSetting.instances.set(key, new ModelDbSetting(databaseName));
    }
    return ModelDbSetting.instances.get(key)!;
  }

  public async setSetting(setting: DbSetting) {
    return this.collection.insertOne(setting);
  }
}

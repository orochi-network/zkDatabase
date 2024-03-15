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

  public async updateSetting(setting: DbSetting) {
    const filter = {};
    const update = { $set: setting };
    const options = { upsert: true };
    return this.collection.updateOne(filter, update, options);
  }

  public async getSetting(): Promise<DbSetting | null> {
    const setting = await this.collection.findOne({});
    return setting;
  }

  public async getHeight(): Promise<number | null> {
    const setting = await this.getSetting();
    return setting ? setting.merkleHeight : null;
  }
}

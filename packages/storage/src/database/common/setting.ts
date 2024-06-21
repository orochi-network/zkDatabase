import { zkDatabaseConstants } from "../../common/const.js";
import ModelBasic from "../base/basic.js";

export type DbSetting = {
  merkleHeight: number;
  appPublicKey: string
};

export class ModelDbSetting extends ModelBasic<DbSetting> {
  private static instances = new Map<string, ModelDbSetting>();

  private constructor(databaseName: string) {
    super(databaseName, zkDatabaseConstants.databaseCollections.setting);
  }

  public static getInstance(databaseName: string) {
    const key = databaseName;
    if (!ModelDbSetting.instances.has(key)) {
      ModelDbSetting.instances.set(key, new ModelDbSetting(databaseName));
    }
    return ModelDbSetting.instances.get(key)!;
  }

  public async updateSetting(setting: Partial<DbSetting>) {
    const filter = {};
    const update: { $set: Partial<DbSetting> } = { $set: {} };
    
    if (setting.merkleHeight !== undefined) {
      update.$set.merkleHeight = setting.merkleHeight;
    }
    
    if (setting.appPublicKey !== undefined) {
      update.$set.appPublicKey = setting.appPublicKey;
    }

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

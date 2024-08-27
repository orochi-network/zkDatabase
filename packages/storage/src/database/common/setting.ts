import { FindOptions } from 'mongodb';
import { zkDatabaseConstants } from '../../common/const.js';
import ModelBasic from '../base/basic.js';

export type DbSetting = {
  merkleHeight: number;
  appPublicKey: string;
  databaseOwner: string;
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
    return this.collection.updateOne(
      {},
      {
        $set: Object.fromEntries(
          Object.entries(setting).filter(([k]) =>
            ['merkleHeight', 'appPublicKey', 'databaseOwner'].includes(k)
          )
        ),
      },
      { upsert: true }
    );
  }

  public async getSetting(options?: FindOptions): Promise<DbSetting | null> {
    const setting = await this.collection.findOne({}, options);
    return setting;
  }

  public async getHeight(): Promise<number | null> {
    const setting = await this.getSetting();
    return setting ? setting.merkleHeight : null;
  }
}

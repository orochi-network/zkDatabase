import {
  Filter,
  FindOptions,
  InsertOneOptions,
  InsertOneResult,
  UpdateResult,
} from 'mongodb';
import { zkDatabaseConstants } from '../../common/const.js';
import ModelBasic from '../base/basic.js';

export type DbSetting = {
  databaseName: string;
  merkleHeight: number;
  appPublicKey: string;
  databaseOwner: string;
};

export class ModelDbSetting extends ModelBasic<DbSetting> {
  private static INSTANCE: ModelDbSetting;

  private constructor() {
    super(
      zkDatabaseConstants.globalDatabase,
      zkDatabaseConstants.databaseCollections.setting
    );
  }

  public static getInstance() {
    if (!ModelDbSetting.INSTANCE) {
      this.INSTANCE = new ModelDbSetting();
    }
    return this.INSTANCE;
  }

  public async createSetting(
    setting: DbSetting,
    options?: InsertOneOptions
  ): Promise<InsertOneResult<DbSetting>> {
    try {
      const result = await this.collection.insertOne(setting, options);
      return result;
    } catch (error) {
      throw new Error(`Failed to create database setting: ${error}`);
    }
  }

  public async updateDatabaseName(
    currentName: string,
    newName: string
  ): Promise<UpdateResult> {
    try {
      const result = await this.collection.updateOne(
        { databaseName: currentName },
        { $set: { databaseName: newName } }
      );
      return result;
    } catch (error) {
      throw new Error(`Failed to update database name: ${error}`);
    }
  }

  public async changeDatabaseOwner(
    databaseName: string,
    newOwnerName: string
  ): Promise<UpdateResult> {
    try {
      const result = await this.collection.updateOne(
        { databaseName },
        { $set: { databaseOwner: newOwnerName } }
      );
      return result;
    } catch (error) {
      throw new Error(`Failed to update database name: ${error}`);
    }
  }

  public async updateSetting(
    databaseName: string,
    setting: Partial<DbSetting>
  ) {
    return this.collection.updateOne(
      { databaseName },
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

  public async getSetting(
    databaseName: string,
    options?: FindOptions
  ): Promise<DbSetting | null> {
    try {
      const setting = await this.collection.findOne({ databaseName }, options);
      return setting;
    } catch (error) {
      throw new Error(`Failed to get setting: ${error}`);
    }
  }

  public async findSettingsByFields(
    filter: Filter<DbSetting>,
    options?: FindOptions
  ): Promise<DbSetting[]> {
    try {
      const settings = (
        await this.collection.find(filter, options).toArray()
      ).filter(
        (db) =>
          !['admin', 'local', '_zkdatabase_metadata'].includes(db.databaseName)
      );

      return settings;
    } catch (error) {
      throw new Error(`Failed to find settings: ${error}`);
    }
  }

  public async count(filter?: Filter<DbSetting>) {
    return await this.collection.countDocuments(filter);
  }
}

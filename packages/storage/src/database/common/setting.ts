import { TDbSetting } from '@zkdb/common';
import {
  Filter,
  FindOptions,
  InsertOneOptions,
  InsertOneResult,
  UpdateResult,
} from 'mongodb';
import { zkDatabaseConstants } from '../../common/const.js';
import { DB } from '../../helper/db-instance.js';
import ModelBasic from '../base/basic.js';

export class ModelDbSetting extends ModelBasic<TDbSetting> {
  private static instance: ModelDbSetting;

  private constructor() {
    super(
      zkDatabaseConstants.globalDatabase,
      DB.service,
      zkDatabaseConstants.globalCollections.setting
    );
  }

  public static getInstance() {
    if (!ModelDbSetting.instance) {
      this.instance = new ModelDbSetting();
    }
    return this.instance;
  }

  public async createSetting(
    setting: TDbSetting,
    options?: InsertOneOptions
  ): Promise<InsertOneResult<TDbSetting>> {
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
    setting: Partial<TDbSetting>
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
  ): Promise<TDbSetting | null> {
    try {
      const setting = await this.collection.findOne({ databaseName }, options);
      return setting;
    } catch (error) {
      throw new Error(`Failed to get setting: ${error}`);
    }
  }

  public async findSettingsByFields(
    filter: Filter<TDbSetting>,
    options?: FindOptions
  ): Promise<TDbSetting[]> {
    try {
      const setting = (
        await this.collection.find(filter, options).toArray()
      ).filter(
        (db) =>
          !['admin', 'local', '_zkdatabase_metadata'].includes(db.databaseName)
      );

      return setting;
    } catch (error) {
      throw new Error(`Failed to find setting: ${error}`);
    }
  }

  public async count(filter?: Filter<TDbSetting>) {
    return await this.collection.countDocuments(filter);
  }
}

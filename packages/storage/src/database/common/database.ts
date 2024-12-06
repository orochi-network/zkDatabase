import { TDatabase, TDatabaseRecord } from '@zkdb/common';
import {
  Filter,
  FindOptions,
  InsertOneOptions,
  InsertOneResult,
  UpdateOptions,
  UpdateResult,
  WithoutId,
} from 'mongodb';
import { zkDatabaseConstants } from '../../common/const.js';
import { DB } from '../../helper/db-instance.js';
import ModelBasic from '../base/basic.js';

const SYSTEM_DATABASE_SET = new Set(['admin', 'local', '_zkdatabase_metadata']);
export class ModelDatabase extends ModelBasic<WithoutId<TDatabaseRecord>> {
  private static instance: ModelDatabase;

  private constructor() {
    super(
      zkDatabaseConstants.globalDatabase,
      DB.service,
      zkDatabaseConstants.globalCollections.setting
    );
  }

  public static getInstance() {
    if (!ModelDatabase.instance) {
      this.instance = new ModelDatabase();
    }
    return this.instance;
  }

  public async createDatabase(
    database: WithoutId<TDatabaseRecord>,
    options?: InsertOneOptions
  ): Promise<InsertOneResult<TDatabaseRecord>> {
    try {
      const result = await this.collection.insertOne(database, options);
      return result;
    } catch (error) {
      throw new Error(`Failed to create database: ${error}`);
    }
  }

  public async updateDatabase(
    databaseName: string,
    updateField: Partial<Pick<TDatabaseRecord, keyof TDatabaseRecord>>,
    options?: UpdateOptions
  ): Promise<UpdateResult> {
    // Runtime validation ensure no empty update
    if (Object.keys(updateField).length === 0) {
      throw new Error('No field provided for update');
    }
    try {
      const result = await this.collection.updateOne(
        { databaseName: databaseName },
        { $set: updateField },
        options
      );
      return result;
    } catch (error) {
      throw new Error(`Failed to update database name: ${error}`);
    }
  }

  public async getDatabase(
    databaseName: string,
    options?: FindOptions
  ): Promise<TDatabase | null> {
    try {
      const database = await this.collection.findOne({ databaseName }, options);
      return database;
    } catch (error) {
      throw new Error(`Failed to get database: ${error}`);
    }
  }

  public async getListDatabase(
    filter: Filter<TDatabase>,
    options?: FindOptions
  ): Promise<TDatabase[]> {
    try {
      // Prevent user getting system database
      return (await this.collection.find(filter, options).toArray()).filter(
        (db) => !SYSTEM_DATABASE_SET.has(db.databaseName)
      );
    } catch (error) {
      throw new Error(`Failed to find database: ${error}`);
    }
  }

  public async count(filter?: Filter<TDatabase>) {
    return await this.collection.countDocuments(filter);
  }
}

import {
  Filter,
  FindOptions,
  InsertOneOptions,
  InsertOneResult,
} from 'mongodb';
import { zkDatabaseConstants } from '../../common/const.js';
import ModelBasic from '../base/basic.js';

export type DbDeploy = {
  databaseName: string;
  merkleHeight: number;
  appPublicKey: string;
  tx: string;
};

export class ModelDbDeployTx extends ModelBasic<DbDeploy> {
  private static INSTANCE: ModelDbDeployTx;

  private constructor() {
    super(
      zkDatabaseConstants.globalDatabase,
      zkDatabaseConstants.globalCollections.deploy
    );
  }

  public static getInstance() {
    if (!ModelDbDeployTx.INSTANCE) {
      this.INSTANCE = new ModelDbDeployTx();
    }
    return this.INSTANCE;
  }

  public async create(
    args: DbDeploy,
    options?: InsertOneOptions
  ): Promise<InsertOneResult<DbDeploy>> {
    try {
      const result = await this.collection.insertOne(args, options);
      return result;
    } catch (error) {
      throw new Error(`Failed to create database setting: ${error}`);
    }
  }

  public async getTx(
    databaseName: string,
    options?: FindOptions
  ): Promise<DbDeploy | null> {
    try {
      const tx = await this.collection.findOne({ databaseName }, options);
      return tx;
    } catch (error) {
      throw new Error(`Failed to get deploy transaction: ${error}`);
    }
  }

  public async remove(databaseName: string) {
    const res = await this.collection.deleteOne({ databaseName });
    return res.deletedCount === 1;
  }
  public async count(filter?: Filter<DbDeploy>) {
    return await this.collection.countDocuments(filter);
  }
}

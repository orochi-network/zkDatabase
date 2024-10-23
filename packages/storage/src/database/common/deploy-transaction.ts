import { Filter, InsertOneOptions, InsertOneResult } from 'mongodb';
import { zkDatabaseConstants } from '../../common/const.js';
import ModelBasic from '../base/basic.js';

export type DbDeploy = {
  databaseName: string;
  merkleHeight: number;
  appPublicKey: string;
  databaseOwner: string;
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

  public async count(filter?: Filter<DbDeploy>) {
    return await this.collection.countDocuments(filter);
  }
}

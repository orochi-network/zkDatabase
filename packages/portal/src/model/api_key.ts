import {
  IModelCondition,
  IPagination,
  IResponse,
  ModelMysqlBasic,
} from '@orochi-network/framework';
import { Knex } from 'knex';
import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { IBaseEntity } from './base_modal';

export interface IApiKey extends IBaseEntity {
  userId: number;
  name: string;
  key: string;
}

export class ModelApiKey extends ModelMysqlBasic<IApiKey> {
  constructor() {
    super('api_key');
  }

  public basicQuery(): Knex.QueryBuilder {
    return this.getDefaultKnex().select('*');
  }

  public createApiKey(userId: number, name: string) {
    return this.create({
      key: crypto.randomBytes(32).toString('hex'),
      userId,
      name,
      uuid: uuidv4(),
    });
  }

  public getApiKeyList(
    conditions?: IModelCondition<IApiKey>[],
    pagination: IPagination = { offset: 0, limit: 20, order: [] }
  ): Promise<IResponse<IApiKey>> {
    const queryBuilder = this.basicQuery();
    return this.getListByCondition<IApiKey>(
      this.attachConditions(queryBuilder, conditions),
      pagination
    );
  }
}

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

export interface IFileLog extends IBaseEntity {
  userId: number;
  name: string;
  isRemoved: boolean;
}

export class ModelFileLog extends ModelMysqlBasic<IFileLog> {
  constructor() {
    super('file_log');
  }

  public basicQuery(): Knex.QueryBuilder {
    return this.getDefaultKnex().select('*');
  }

  public async addFile(userId: number, name: string) {
    const [isExist] = await this.get([
      { field: 'name', value: name },
      { field: 'isRemoved', value: false },
    ]);
    if (isExist) {
      return this.update({ userId }, [{ field: 'name', value: name }]);
    }
    return this.create({
      name,
      userId,
      isRemoved: false,
      uuid: uuidv4(),
    });
  }
}

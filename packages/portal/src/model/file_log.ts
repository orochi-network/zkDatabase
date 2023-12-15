import { ModelMysqlBasic } from '@orochi-network/framework';
import { Knex } from 'knex';
import { v4 as uuidv4 } from 'uuid';
import { IBaseEntity } from './base_modal';

export interface IFileLog extends IBaseEntity {
  userId: number;
  name: string;
  isRemoved: boolean;
  hash: string;
}

export class ModelFileLog extends ModelMysqlBasic<IFileLog> {
  constructor() {
    super('file_log');
  }

  public basicQuery(): Knex.QueryBuilder {
    return this.getDefaultKnex().select('*');
  }

  public async addFile(userId: number, name: string, hash: string) {
    const [isExist] = await this.get([
      { field: 'name', value: name },
      { field: 'isRemoved', value: false },
      { field: 'hash', value: hash },
    ]);
    if (isExist) {
      return this.update({ userId }, [
        { field: 'name', value: name },
        { field: 'hash', value: hash },
      ]);
    }
    return this.create({
      name,
      userId,
      isRemoved: false,
      uuid: uuidv4(),
      hash,
    });
  }

  public async getFileLog(arg: string): Promise<IFileLog[]> {
    return this.getDefaultKnex()
      .select('*')
      .whereLike('hash', `%${arg}%`)
      .andWhere('isRemoved', false);
  }

  public async removeFile(hash: string) {
    return this.update({ isRemoved: true }, [
      { field: 'hash', value: hash },
      { field: 'isRemoved', value: false },
    ]);
  }
}

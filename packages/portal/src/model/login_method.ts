import { ModelMysqlBasic } from '@orochi-network/framework';
import { Knex } from 'knex';
import { v4 as uuidv4 } from 'uuid';
import { IBaseEntity } from './base_modal';

export enum EAccountType {
  local = 'local',
  google = 'google',
}

export interface ILoginMethod extends IBaseEntity {
  userId: number;
  type: EAccountType;
  externalId: string;
  email: string;
  password: string;
}

export class ModelLoginMethod extends ModelMysqlBasic<ILoginMethod> {
  constructor() {
    super('login_method');
  }

  public basicQuery(): Knex.QueryBuilder {
    return this.getDefaultKnex().select('*');
  }

  public async createOAuthLoginMethod(
    userId: number,
    email: string,
    externalId: string,
    type: EAccountType
  ) {
    return this.create({
      email,
      userId,
      type,
      uuid: uuidv4(),
      externalId,
    });
  }

  public async isLoginOAuthExist(
    externalId: string,
    email: string
  ): Promise<false | ILoginMethod[]> {
    const currentMethod = <ILoginMethod[]>(
      await this.basicQuery()
        .whereIn('type', [EAccountType.google])
        .where({ externalId })
        .orWhere({ email })
    );
    if (currentMethod.length > 0) return currentMethod;
    return false;
  }
}

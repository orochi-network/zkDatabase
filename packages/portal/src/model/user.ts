import { ModelMysqlBasic } from '@orochi-network/framework';
import { Knex } from 'knex';
import { v4 as uuidv4 } from 'uuid';
import logger from '../helper/logger';

import { EAccountType, ILoginMethod, ModelLoginMethod } from './login_method';
import { IBaseEntity } from './base_modal';

export interface IUser extends IBaseEntity {
  name: string;
  activeCode: string;
  isActivated: boolean;
  banUntil: string;
}

export class ModelUser extends ModelMysqlBasic<IUser> {
  constructor() {
    super('user');
  }

  public basicQuery(): Knex.QueryBuilder {
    return this.getDefaultKnex().select('*');
  }

  public async isOAuthUserExist(email: string): Promise<false | IUser> {
    const currentUser = await this.getKnex()('user as u')
      .select('u.id as id', 'u.uuid as uuid', 'l.type as type')
      .join('login_method as l', 'u.id', 'l.userId')
      .where('l.email', email)
      .whereNot('l.type', 0);
    if (currentUser.length > 0) return <IUser>currentUser[0];
    return false;
  }

  public async isLocalUserExist(email: string): Promise<false | IUser> {
    const currentUser = await this.getKnex()('user as u')
      .select('u.id as id', 'u.uuid as uuid', 'u.name as name')
      .join('login_method as l', 'u.id', 'l.userId')
      .where('l.email', email)
      .where('l.type', EAccountType.local);
    if (currentUser.length > 0) return <IUser>currentUser[0];
    return false;
  }

  public async createOAuthUser(
    email: string,
    type: EAccountType,
    externalId: string
  ) {
    const tx = await this.getKnex().transaction();
    const userUuid = uuidv4();
    try {
      const imLoginMethod = new ModelLoginMethod();
      const [newUser] = await tx(this.tableName).insert(<Partial<IUser>>{
        uuid: userUuid,
        name: userUuid,
        isActivated: true,
      });
      const [newLoginMethod] = await tx('login_method').insert(<
        Partial<ILoginMethod>
      >{
        uuid: uuidv4(),
        userId: newUser,
        type,
        externalId,
        email,
      });
      await tx.commit();
      const [user] = await this.get([{ field: 'id', value: newUser }]);
      const [loginMethod] = await imLoginMethod.get([
        { field: 'id', value: newLoginMethod },
      ]);
      return {
        user,
        loginMethod,
      };
    } catch (error) {
      logger.error(error);
      await tx.rollback();
      throw new Error('Error when create a new user');
    }
  }

  public async getUserByEmail(email: string): Promise<IUser> {
    const dbUser = await this.getKnex()('user as u')
      .select('u.uuid', 'u.id', 'u.name', 'u.isActivated', 'u.activeCode')
      .join('login_method as l', 'u.id', 'l.userId')
      .where('l.type', 0)
      .where('l.email', email);
    return dbUser?.[0] as IUser;
  }
}

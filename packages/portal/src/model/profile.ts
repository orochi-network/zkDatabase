import { ModelMysqlBasic, Transaction } from '@orochi-network/framework';
import { v4 as uuidv4 } from 'uuid';
import { Knex } from 'knex';
import logger from '../helper/logger';
import { IBaseEntity } from './base_modal';

export interface IProfile extends IBaseEntity {
  id: number;
  uuid: string;
  userId: number;
  key: string;
  value: string;
  updatedDate: string;
  createdDate: string;
}

export interface IBasicUserProfile {
  firstName?: string;
  lastName?: string;
  [field: string]: any;
}
type Entry<O, K extends keyof O> = [K, O[K]];

export class ModelProfile extends ModelMysqlBasic<IProfile> {
  constructor() {
    super('profile');
  }

  private _profile: IBasicUserProfile = {};

  public basicQuery(): Knex.QueryBuilder {
    return this.getDefaultKnex().select('*');
  }

  public async updateProfile(userId: number, updatingProps: IBasicUserProfile) {
    await Transaction.getInstance()
      .process(async (tx) => {
        const entries = Object.entries(updatingProps);
        const jobs = [];

        const buildAsyncFunc = async (entry: Entry<string, any>) => {
          const [k, v] = entry;
          const isExist = await tx(this.tableName).where({ key: k, userId });

          if (!isExist.length) {
            // Create new profile record if not exist
            await tx(this.tableName).insert({
              key: k,
              value: v,
              userId,
              uuid: uuidv4(),
            });
          } else {
            await tx(this.tableName)
              .update({ value: v })
              .where({ key: k, userId });
          }
        };

        for (let i = 0; i < entries.length; i += 1) {
          jobs.push(buildAsyncFunc(entries[i]));
        }

        await Promise.all(jobs);
      })
      .catch(async (err: Error) => {
        logger.error(err);
      })
      .exec();
    return true;
  }

  public async getProfile(userId: number): Promise<IBasicUserProfile> {
    const profileData = await this.basicQuery().where('userId', userId);
    if (profileData.length > 0) {
      profileData.forEach((item: IProfile) => {
        this._profile[item.key] = item.value;
      });
    }
    return this._profile;
  }
}

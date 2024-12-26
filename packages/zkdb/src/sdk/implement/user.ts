/* eslint-disable no-unused-vars */
/* eslint-disable no-dupe-class-members */
import { IApiClient } from '@zkdb/api';
import { TUser } from '@zkdb/common';
import { IUser } from '../interfaces/user';

/**
 * Class representing a user.
 * @class User
 * @implements {IUser}
 */
export class User implements IUser {
  private apiClient: IApiClient;

  private userFilter: Partial<Pick<TUser, 'email' | 'publicKey' | 'userName'>>;

  constructor(
    apiClient: IApiClient,
    userFilter: Partial<Pick<TUser, 'email' | 'publicKey' | 'userName'>>
  ) {
    this.apiClient = apiClient;
    this.userFilter = userFilter;
  }

  async info(): Promise<Omit<TUser, 'userData'> | null> {
    const result = (
      await this.apiClient.user.userFind({
        query: this.userFilter,
        pagination: { limit: 1, offset: 0 },
      })
    ).unwrap();
    if (result.data.length === 1) {
      return result.data[0];
    }
    return null;
  }

  async exist(): Promise<boolean> {
    const result = await this.info();
    return result !== null;
  }
}

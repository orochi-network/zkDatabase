import { IApiClient } from '@zkdb/api';
import { TGroupListByUserResponse, TUser } from '@zkdb/common';
import { IUser } from '../interfaces/user';

/**
 * Class representing a user.
 * @class User
 * @implements {IUser}
 */
export class User implements IUser {
  private apiClient: IApiClient;

  private databaseName: string;

  private userFilter: Partial<Pick<TUser, 'email' | 'publicKey' | 'userName'>>;

  constructor(
    apiClient: IApiClient,
    databaseName: string,
    userFilter: Partial<Pick<TUser, 'email' | 'publicKey' | 'userName'>>
  ) {
    this.apiClient = apiClient;
    this.databaseName = databaseName;
    this.userFilter = userFilter;
  }

  async listGroup(): Promise<TGroupListByUserResponse> {
    const result = (
      await this.apiClient.group.groupListByUser({
        databaseName: this.databaseName,
        userQuery: this.userFilter,
      })
    ).unwrap();
    return result;
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

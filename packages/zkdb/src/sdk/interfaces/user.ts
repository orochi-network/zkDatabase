import { TGroupListByUserResponse, TUser } from '@zkdb/common';

/**
 * Interface for user operations.
 * @interface IUser
 */
export interface IUser {
  /**
   * Retrieves the user's information.
   * @returns {Promise<Omit<TUser, 'userData'>>} A promise that resolves to the user's record.
   */
  info(): Promise<Omit<TUser, 'userData'> | null>;

  /**
   * Lists all groups associated with the user.
   * @returns {Promise<TGroupListByUserResponse>} A promise that resolves to a list of group responses.
   */
  listGroup(): Promise<TGroupListByUserResponse>;

  /**
   * Checks if the user exists in the system.
   * @returns {Promise<boolean>} A promise that resolves to true if the user exists, false otherwise.
   */
  exist(): Promise<boolean>;
}

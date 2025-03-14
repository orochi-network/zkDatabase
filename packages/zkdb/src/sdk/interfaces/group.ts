import { TGroup, TGroupDetail } from '@zkdb/common';

/**
 * Group configuration type
 * @property {string} groupDescription - Group description
 * @property {string} groupName - Group name
 */
export type TGroupConfig = Pick<TGroup, 'groupDescription' | 'groupName'>;

/**
 * Group Interface for group operations
 */
export interface IGroup {
  /**
   * Get group information
   * @returns {Promise<TGroupDetail>} Group detail information
   */
  info(): Promise<TGroupDetail | null>;

  /**
   * Create a new group
   * @param groupConfig - Group configuration object
   * @returns {Promise<boolean>} - True if group creation is successful, false otherwise
   */
  create(groupConfig?: Omit<TGroupConfig, 'groupName'>): Promise<boolean>;

  /**
   * Check the existence of a group in database
   * @returns {Promise<boolean>} true if the current group is exist, otherwise false
   */
  exist(): Promise<boolean>;

  /**
   * Update an existing group
   * @param groupConfig - Group configuration object
   * @returns {Promise<boolean>} - True if group update is successful, false otherwise
   */
  update(groupConfig: Partial<TGroupConfig>): Promise<boolean>;

  /**
   * Add a list of users to a group
   * @param listUser - List of users to add to the group
   * @returns {Promise<boolean>} - True if users are added successfully, false otherwise
   */
  userAdd(listUser: string[]): Promise<boolean>;

  /**
   * Remove a list of users from a group
   * @param listUser - List of users to remove from the group
   * @returns {Promise<boolean>} - True if users are removed successfully, false otherwise
   */
  userRemove(listUser: string[]): Promise<boolean>;
}

import { TGroup, TGroupDetail } from '@zkdb/common';
import { ClientSession } from 'mongodb';
import { getCurrentTime } from '../../helper/common.js';
import ModelGroup from '../../model/database/group.js';
import ModelUserGroup from '../../model/database/user-group.js';
import ModelUser from '../../model/global/user.js';
import { isDatabaseOwner } from './database.js';

// Base TParamGroup
type TParamGroup = TGroup & {
  databaseName: string;
};

type TParamGroupExist = Pick<TParamGroup, 'databaseName' | 'groupName'>;

type TParamGroupCreate = TParamGroup;

type TParamGroupDetail = Pick<TParamGroup, 'databaseName' | 'groupName'>;

type TParamGroupIsParticipant = Pick<
  TParamGroup,
  'databaseName' | 'groupName'
> & { userName: string };

type TParamGroupUpdateMetadata = Pick<
  TParamGroup,
  'databaseName' | 'groupName' | 'createdBy'
> & {
  newGroupName?: string;
  newDescription?: string;
};

type TParamGroupAddListUser = Pick<
  TParamGroup,
  'databaseName' | 'createdBy' | 'groupName'
> & {
  listUserName: string[];
};

/**
 * The `Group` class provides methods to manage groups, including creating groups,
 * updating metadata, managing participants, and retrieving group details.
 */
export class Group {
  /**
   * Checks if a group exists based on the provided parameters.
   *
   * @param params - The parameters used to filter and identify the group, following the `TParamGroupBase` type.
   * @param session - (Optional) The MongoDB session for transactional queries.
   * @returns A promise resolving to `true` if a matching group exists, otherwise `false`.
   */
  public static async isExist(
    params: TParamGroupExist,
    session?: ClientSession
  ): Promise<boolean> {
    const { databaseName, groupName } = params;

    const modelGroup = new ModelGroup(databaseName);

    const group = await modelGroup.findOne({ groupName }, { session });

    return group != null;
  }

  /**
   * Creates a new group based on the provided parameters.
   *
   * @param params - The parameters required to create the group, adhering to the `TParamGroupCreate` type.
   * @param session - (Optional) The MongoDB session for transactional queries.
   * @returns A promise resolving to `true` if the group is created successfully, otherwise `false`.
   */
  public static async create(
    params: TParamGroupCreate,
    session?: ClientSession
  ): Promise<boolean> {
    const { databaseName, groupName, groupDescription, createdBy } = params;

    // Checking actor is owner first
    if (await isDatabaseOwner(databaseName, createdBy, session)) {
      // Checking group existed before
      if (await Group.isExist({ databaseName, groupName }, session)) {
        throw new Error(
          `Group ${groupName} is already exist for database ${databaseName}`
        );
      }
      // Initialize model
      const modelGroup = new ModelGroup(databaseName);
      const modelUserGroup = new ModelUserGroup(databaseName);
      const modelUser = new ModelUser();

      // Get user
      const user = await modelUser.findOne(
        { userName: createdBy },
        { session }
      );
      // Checking user exist
      if (user) {
        // Create group instance
        const group = await modelGroup.create(
          {
            groupName,
            groupDescription: groupDescription || `Group ${groupName}`,
            createdBy,
            createdAt: getCurrentTime(),
            updatedAt: getCurrentTime(),
          },
          { session }
        );

        // Create user-group instance
        const userGroup = await modelUserGroup.createUserGroup(
          {
            userName: user.userName,
            groupOjectId: group.insertedId,
            userObjectId: user._id,
            createdAt: getCurrentTime(),
            updatedAt: getCurrentTime(),
            groupName: groupName,
          },
          { session }
        );

        // Make sure both group & userGroup inserted
        return group.acknowledged && userGroup.acknowledged;
      }
    }

    throw new Error('Only database owner allowed to create group');
  }

  /**
   * Retrieves detailed information about a group based on the provided parameters.
   *
   * @param params - The parameters to identify the group, following the `TParamGroupDetail` type.
   * @param session - (Optional) The MongoDB session for transactional queries.
   * @returns A promise resolving to the group detail, conforming to the `TGroupDetail` type.
   */
  public static async getDetail(
    params: TParamGroupDetail,
    session?: ClientSession
  ): Promise<TGroupDetail> {
    const { databaseName, groupName } = params;

    // Checking group existed before
    if (!(await Group.isExist({ databaseName, groupName }, session))) {
      throw Error(
        `Group ${groupName} does not exist for database ${databaseName}`
      );
    }
    // Initialize model
    const modelUserGroup = new ModelUserGroup(databaseName);
    const modelGroup = new ModelGroup(databaseName);
    // Find group
    const group = await modelGroup.findOne({ groupName });

    if (group) {
      const listParticipant = await modelUserGroup
        .find({
          groupOjectId: group._id,
        })
        .toArray();

      return {
        ...group,
        listUser: listParticipant,
      };
    }

    throw new Error('Group not existed');
  }

  /**
   * Checks if a user is a participant in a group based on the provided parameters.
   *
   * @param params - The parameters to identify the group and user, following the `TParamGroupIsParticipant` type.
   * @param session - (Optional) The MongoDB session for transactional queries.
   * @returns A promise resolving to `true` if the user is a participant, otherwise `false`.
   */
  public static async isParticipant(
    params: TParamGroupIsParticipant,
    session?: ClientSession
  ): Promise<boolean> {
    const { databaseName, groupName, userName } = params;

    // Checking group existed before
    if (!(await Group.isExist({ databaseName, groupName }, session))) {
      throw Error(
        `Group ${groupName} does not exist for database ${databaseName}`
      );
    }
    // Initialize model
    const modelUserGroup = new ModelUserGroup(databaseName);
    const listGroup = await modelUserGroup.listGroupByUserName(userName, {
      session,
    });
    // Checking whether the group is a part of list Group of that user
    return listGroup.includes(groupName);
  }

  /**
   * Updates the metadata of a group based on the provided parameters.
   *
   * @param params - The parameters specifying the group and the metadata to update, following the `TParamGroupUpdateMetadata` type.
   * @param session - (Optional) The MongoDB session for transactional queries.
   * @returns A promise resolving to `true` if the metadata was updated successfully, otherwise `false`.
   */
  public static async updateMetadata(
    params: TParamGroupUpdateMetadata,
    session?: ClientSession
  ): Promise<boolean> {
    const { databaseName, groupName, createdBy, newGroupName, newDescription } =
      params;
    // Check if user don't input both newDescription & newGroupName
    // Using Falsy to ensure user don't input thing like '', 0, null
    if (!newGroupName && !newDescription) {
      throw new Error('Need to provide at least one field to update');
    }
    // Check actor permission
    if (await isDatabaseOwner(databaseName, createdBy, session)) {
      // Initialize model
      const modelGroup = new ModelGroup(databaseName);
      // Find group
      // TODO: If using findOneAndUpdate, these code would cleaner not separate 2 query and 1 exist checking
      const group = await modelGroup.findOne({ groupName }, { session });
      if (group) {
        const groupUpdateResult = await modelGroup.updateOne(
          {
            groupName,
            createdBy,
          },
          {
            // MongoDB will not update if value is 'undefined', no need checking
            $set: { groupName: newGroupName, groupDescription: newDescription },
          },
          { session }
        );
        // If new group name, modelUserGroup need to be update too
        if (newGroupName) {
          // Initialize modelUserGroup here
          const modelUserGroup = new ModelUserGroup(databaseName);

          const userGroupUpdateResult = await modelUserGroup.updateOne(
            {
              groupOjectId: group._id,
            },
            {
              $set: { groupName: newGroupName },
            },
            { session }
          );
          // Ensure both of these 2 models are updated if update new groupName
          return (
            groupUpdateResult.acknowledged && userGroupUpdateResult.acknowledged
          );
        }

        return groupUpdateResult.acknowledged;
      }
      throw Error(`Group ${groupName} does not exist`);
    }

    throw Error('Only database owner allowed to rename group');
  }

  /**
   * Adds a list of users to a group based on the provided parameters.
   *
   * @param params - The parameters specifying the group and the users to add, following the `TParamGroupAddListUser` type.
   * @param session - (Optional) The MongoDB session for transactional queries.
   * @returns A promise resolving to `true` if the users were added successfully, otherwise `false`.
   */
  public static async addListUserToGroup(
    params: TParamGroupAddListUser,
    session?: ClientSession
  ): Promise<boolean> {
    const { databaseName, groupName, createdBy, listUserName } = params;
    // Permission owner checking
    if (await isDatabaseOwner(databaseName, createdBy, session)) {
      // Initialize group model
      const modelGroup = new ModelGroup(databaseName);

      const group = await modelGroup.findOne({ groupName }, { session });

      if (group) {
        const modelUser = new ModelUser();
        // Check list of user exist
        if (await modelUser.areUsersExist(listUserName)) {
          const modelUserGroup = new ModelUserGroup(databaseName);
          const result = await modelUserGroup.addUserListToGroup(
            listUserName,
            groupName,
            {
              session,
            }
          );

          return result.isOk();
        }

        throw Error('Some of user in list do not exist');
      }

      throw Error(`Group ${group} does not exist`);
    }
    throw Error('Only database owner allowed to add users to group');
  }

  /**
   * Removes a list of users from a group based on the provided parameters.
   *
   * @param params - The parameters specifying the group and the users to remove, following the `TParamGroupAddListUser` type.
   * @param session - (Optional) The MongoDB session for transactional queries.
   * @returns A promise resolving to `true` if the users were removed successfully, otherwise `false`.
   */
  public static async removeListUserFromGroup(
    params: TParamGroupAddListUser,
    session?: ClientSession
  ): Promise<boolean> {
    const { databaseName, groupName, createdBy, listUserName } = params;
    // Permission owner checking
    if (await isDatabaseOwner(databaseName, createdBy, session)) {
      // Initialize group model
      const modelGroup = new ModelGroup(databaseName);

      const group = await modelGroup.findOne({ groupName }, { session });

      if (group) {
        const modelUser = new ModelUser();
        // Check list of user exist
        if (await modelUser.areUsersExist(listUserName)) {
          const modelUserGroup = new ModelUserGroup(databaseName);
          const result = await modelUserGroup.removeUserListFromGroup(
            listUserName,
            groupName,
            {
              session,
            }
          );

          return result.isOk();
        }

        throw Error('Some of user in list do not exist');
      }

      throw Error(`Group ${group} does not exist`);
    }
    throw Error('Only database owner allowed to add users to group');
  }
}

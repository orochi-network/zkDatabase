import {
  TGroupDetail,
  TGroupParam,
  TGroupParamCreate,
  TGroupParamListUser,
  TGroupParamUpdateMetadata,
  groupName as joiGroupName,
  groupDescription as joiGroupDescription,
} from '@zkdb/common';
import { ClientSession } from 'mongodb';
import { getCurrentTime } from '../../helper/common.js';
import ModelGroup from '../../model/database/group.js';
import ModelUserGroup from '../../model/database/user-group.js';
import ModelUser from '../../model/global/user.js';
import { Database } from './database.js';

/**
 * The `Group` class provides methods to manage groups, including creating groups,
 * updating metadata, managing participants, and retrieving group details.
 */
export class Group {
  /**
   * Checks if a group exists based on the provided parameters.
   *
   * @param paramGroup - The parameters used to filter and identify the group, following the `TGroupParam` type.
   * @param session - (Optional) The MongoDB session for transactional queries.
   * @returns A promise resolving to `true` if a matching group exists, otherwise `false`.
   */
  public static async exist(
    paramGroup: TGroupParam,
    session?: ClientSession
  ): Promise<boolean> {
    const { databaseName, groupName } = paramGroup;

    const modelGroup = new ModelGroup(databaseName);

    const group = await modelGroup.findOne({ groupName }, { session });

    return group != null;
  }

  /**
   * Creates a new group based on the provided parameters.
   *
   * @param paramGroupCreate - The parameters required to create the group, adhering to the `TGroupParamCreate` type.
   * @param session - (Optional) The MongoDB session for transactional queries.
   * @returns A promise resolving to `true` if the group is created successfully, otherwise `false`.
   */
  public static async create(
    paramGroupCreate: TGroupParamCreate,
    session?: ClientSession
  ): Promise<boolean> {
    const { databaseName, groupName, groupDescription, createdBy } =
      paramGroupCreate;

    // Checking actor is owner first
    if (
      await Database.isOwner(
        { databaseName, databaseOwner: createdBy },
        session
      )
    ) {
      // Checking group existed before
      if (await Group.exist({ databaseName, groupName }, session)) {
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
        const group = await modelGroup.insertOne(
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
        const userGroup = await modelUserGroup.insertOne(
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
   * @param paramGroup - The parameters to identify the group, following the `TGroupParam` type.
   * @param session - (Optional) The MongoDB session for transactional queries.
   * @returns A promise resolving to the group detail, conforming to the `TGroupDetail` type.
   */
  public static async detail(
    paramGroup: TGroupParam,
    session?: ClientSession
  ): Promise<TGroupDetail> {
    const { databaseName, groupName } = paramGroup;

    // Checking group existed before
    if (!(await Group.exist({ databaseName, groupName }, session))) {
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
   * Updates the metadata of a group based on the provided parameters.
   *
   * @param paramUpdateMetadata - The parameters specifying the group and the metadata to update, following the `TGroupParamUpdateMetadata` type.
   * @param session - (Optional) The MongoDB session for transactional queries.
   * @returns A promise resolving to `true` if the metadata was updated successfully, otherwise `false`.
   */
  public static async updateMetadata(
    paramUpdateMetadata: TGroupParamUpdateMetadata,
    session?: ClientSession
  ): Promise<boolean> {
    const {
      databaseName,
      groupName,
      createdBy,
      newGroupName,
      newGroupDescription,
    } = paramUpdateMetadata;
    // Check if user don't input both newDescription & newGroupName
    // Using Falsy to ensure user don't input thing like '', 0, null
    if (!newGroupName && !newGroupDescription) {
      throw new Error('Need to provide at least one field to update');
    }
    // Double check new group name and description with Joi
    const { error: groupDescriptionErr } =
      joiGroupDescription(false).validate(newGroupDescription);
    const { error: groupNameErr } = joiGroupName(false).validate(newGroupName);

    if (groupDescriptionErr) {
      throw new Error(`Description Error: ${groupDescriptionErr.message}`);
    }

    if (groupNameErr) {
      throw new Error(`Name Error: ${groupNameErr.message}`);
    }

    // Check actor permission
    if (
      await Database.isOwner(
        { databaseName, databaseOwner: createdBy },
        session
      )
    ) {
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
            $set: {
              groupName: newGroupName,
              groupDescription: newGroupDescription,
            },
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
   * @param paramListUser - The parameters specifying the group and the users to add, following the `TGroupParamListUser` type.
   * @param session - (Optional) The MongoDB session for transactional queries.
   * @returns A promise resolving to `true` if the users were added successfully, otherwise `false`.
   */
  public static async addListUser(
    paramListUser: TGroupParamListUser,
    session?: ClientSession
  ): Promise<boolean> {
    const { databaseName, groupName, createdBy, listUserName } = paramListUser;
    // Permission owner checking
    if (
      await Database.isOwner(
        {
          databaseName,
          databaseOwner: createdBy,
        },
        session
      )
    ) {
      // Initialize group model
      const modelGroup = new ModelGroup(databaseName);

      const group = await modelGroup.findOne({ groupName }, { session });

      if (group) {
        const modelUser = new ModelUser();
        // Check list of user exist
        if (await modelUser.isListUserExist(listUserName)) {
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
   * @param paramListUser - The parameters specifying the group and the users to remove, following the `TGroupParamListUser` type.
   * @param session - (Optional) The MongoDB session for transactional queries.
   * @returns A promise resolving to `true` if the users were removed successfully, otherwise `false`.
   */
  public static async removeListUser(
    paramListUser: TGroupParamListUser,
    session?: ClientSession
  ): Promise<boolean> {
    const { databaseName, groupName, createdBy, listUserName } = paramListUser;
    // Permission owner checking
    if (
      await Database.isOwner(
        { databaseName, databaseOwner: createdBy },
        session
      )
    ) {
      // Initialize group model
      const modelGroup = new ModelGroup(databaseName);

      const group = await modelGroup.findOne({ groupName }, { session });

      if (group) {
        const modelUser = new ModelUser();
        // Check list of user exist
        if (await modelUser.isListUserExist(listUserName)) {
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

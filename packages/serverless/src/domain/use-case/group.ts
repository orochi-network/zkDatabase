import { ClientSession } from 'mongodb';
import { getCurrentTime } from '../../helper/common.js';
import ModelGroup from '../../model/database/group.js';
import ModelUserGroup from '../../model/database/user-group.js';
import ModelUser from '../../model/global/user.js';
import { isDatabaseOwner } from './database.js';

async function isGroupExist(
  databaseName: string,
  groupName: string,
  session?: ClientSession
): Promise<boolean> {
  const modelGroup = new ModelGroup(databaseName);

  const group = await modelGroup.findGroup(groupName, session);

  return group != null;
}

async function createGroup(
  databaseName: string,
  actor: string,
  groupName: string,
  groupDescription?: string,
  session?: ClientSession
): Promise<boolean> {
  if (await isDatabaseOwner(databaseName, actor, session)) {
    if (await isGroupExist(databaseName, groupName, session)) {
      throw Error(
        `Group ${groupName} is already exist for database ${databaseName}`
      );
    }
    // Initialize model
    const modelGroup = new ModelGroup(databaseName);
    const modelUserGroup = new ModelUserGroup(databaseName);
    const modelUser = new ModelUser();

    const user = await modelUser.findOne({ userName: actor }, { session });
    if (user) {
      // Create group first
      const group = await modelGroup.createGroup(
        groupName,
        groupDescription,
        actor,
        { session }
      );
      // Create user group
      const userGroup = await modelUserGroup.createUserGroup(
        {
          userName: actor,
          groupOjectId: group.insertedId,
          userObjectId: user._id,
          createdAt: getCurrentTime(),
          updatedAt: getCurrentTime(),
          groupName: groupName,
        },
        { session }
      );
      // Make sure both group & userGroup inserted
      return group != null && userGroup != null;
    }
    throw new Error('User can not be found');
  }

  throw Error('Only database owner allowed to create group');
}

async function getGroupInfoDetail(
  databaseName: string,
  groupName: string,
  session?: ClientSession
) {
  if (!(await isGroupExist(databaseName, groupName, session))) {
    throw Error(
      `Group ${groupName} does not exist for database ${databaseName}`
    );
  }
  const modelUserGroup = new ModelUserGroup(databaseName);
  const modelGroup = new ModelGroup(databaseName);
  const group = await modelGroup.findOne({ groupName });
  if (!group) {
    throw new Error('Group not existed');
  }
  return {
    ...group,
    listUser: await (
      await modelUserGroup.find({ groupId: group._id })
    ).toArray(),
  };
}
async function checkUserGroupMembership(
  databaseName: string,
  actor: string,
  groupName: string,
  session?: ClientSession
): Promise<boolean> {
  if (!(await isGroupExist(databaseName, groupName, session))) {
    throw Error(
      `Group ${groupName} does not exist for database ${databaseName}`
    );
  }

  const modelUserGroup = new ModelUserGroup(databaseName);
  const actorGroups = await modelUserGroup.listGroupByUserName(actor, {
    session,
  });
  return actorGroups.includes(groupName);
}

async function addUserToGroups(
  databaseName: string,
  actor: string,
  groups: string[],
  session?: ClientSession
): Promise<boolean> {
  const modelUserGroup = new ModelUserGroup(databaseName);
  const result = await modelUserGroup.addUserToGroup(actor, groups, {
    session,
  });

  return result.isOk();
}

async function changeGroupDescription(
  databaseName: string,
  actor: string,
  groupName: string,
  newGroupDescription: string,
  session?: ClientSession
): Promise<boolean> {
  if (await isDatabaseOwner(databaseName, actor, session)) {
    const modelGroup = new ModelGroup(databaseName);
    const group = await modelGroup.findGroup(groupName, session);

    if (group) {
      // TODO: We can update without searching for the group first
      const result = await modelGroup.updateOne(
        {
          _id: (group as any)._id,
        },
        {
          $set: { description: newGroupDescription },
        },
        { session }
      );

      return result.modifiedCount === 1;
    }

    throw Error(`Group ${group} does not exist`);
  }

  throw Error('Only database owner allowed to change description of group');
}

async function addUsersToGroup(
  databaseName: string,
  actor: string,
  group: string,
  users: string[],
  session?: ClientSession
): Promise<boolean> {
  if (await isDatabaseOwner(databaseName, actor, session)) {
    const modelGroup = new ModelGroup(databaseName);
    const modelUser = new ModelUser();
    const groupExist = (await modelGroup.findGroup(group, session)) !== null;

    if (groupExist) {
      if (await modelUser.areUsersExist(users)) {
        const modelUserGroup = new ModelUserGroup(databaseName);
        const result = await modelUserGroup.addUsersToGroup(users, group, {
          session,
        });

        return result.isOk();
      }

      throw Error('Some of users do not exist');
    }

    throw Error(`Group ${group} does not exist`);
  }

  throw Error('Only database owner allowed to add users to group');
}

async function excludeUsersToGroup(
  databaseName: string,
  actor: string,
  group: string,
  users: string[],
  session?: ClientSession
): Promise<boolean> {
  if (await isDatabaseOwner(databaseName, actor, session)) {
    const modelGroup = new ModelGroup(databaseName);
    const modelUser = new ModelUser();

    const groupExist = (await modelGroup.findGroup(group, session)) !== null;

    if (groupExist) {
      if (await modelUser.areUsersExist(users)) {
        const modelUserGroup = new ModelUserGroup(databaseName);
        const result = await modelUserGroup.removeUsersFromGroup(users, group, {
          session,
        });

        return result.isOk();
      }

      throw Error('Some of users do not exist');
    }

    throw Error(`Group ${group} does not exist`);
  }

  throw Error('Only database owner allowed to exclude users from group');
}

async function renameGroup(
  databaseName: string,
  actor: string,
  groupName: string,
  newGroupName: string,
  session?: ClientSession
) {
  if (await isDatabaseOwner(databaseName, actor, session)) {
    const modelUserGroup = new ModelGroup(databaseName);
    const group = await modelUserGroup.findGroup(groupName);
    if (group) {
      const result = await modelUserGroup.collection.updateOne(
        {
          groupName,
        },
        { $set: { groupName: newGroupName } }
      );
      return result && result.modifiedCount === 1;
    }
    throw Error(`Group ${groupName} does not exist`);
  }

  throw Error('Only database owner allowed to rename group');
}
export {
  addUsersToGroup,
  addUserToGroups,
  changeGroupDescription,
  checkUserGroupMembership,
  createGroup,
  excludeUsersToGroup,
  getGroupInfoDetail,
  getUsersGroup,
  isGroupExist,
  renameGroup,
};

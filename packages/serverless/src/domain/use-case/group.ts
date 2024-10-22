import { ClientSession } from 'mongodb';
import ModelGroup from '../../model/database/group.js';
import ModelUserGroup, { TGroupInfo } from '../../model/database/user-group.js';
import { isDatabaseOwner } from './database.js';
import { areUsersExist } from './user.js';
import { NetworkId } from '../types/network.js';

async function isGroupExist(
  databaseName: string,
  groupName: string,
  networkId: NetworkId,
  session?: ClientSession
): Promise<boolean> {
  const modelGroup = ModelGroup.getInstance(databaseName, networkId);

  const group = await modelGroup.findGroup(groupName, session);

  return group != null;
}

async function createGroup(
  databaseName: string,
  networkId: NetworkId,
  actor: string,
  groupName: string,
  groupDescription?: string,
  session?: ClientSession
): Promise<boolean> {
  if (await isDatabaseOwner(databaseName, actor, networkId)) {
    if (await isGroupExist(databaseName, groupName, networkId, session)) {
      throw Error(
        `Group ${groupName} is already exist for database ${databaseName}`
      );
    }

    const modelGroup = ModelGroup.getInstance(databaseName, networkId);

    const group = await modelGroup.createGroup(
      groupName,
      groupDescription,
      actor,
      { session }
    );

    return group != null;
  }

  throw Error('Only database owner allowed to create group');
}

async function getGroupInfo(
  databaseName: string,
  groupName: string,
  networkId: NetworkId,
  session?: ClientSession
): Promise<TGroupInfo> {
  if (!(await isGroupExist(databaseName, groupName, networkId, session))) {
    throw Error(
      `Group ${groupName} does not exist for database ${databaseName}`
    );
  }
  const modelUserGroup = ModelUserGroup.getInstance(databaseName, networkId);
  const modelGroup = ModelGroup.getInstance(databaseName, networkId);
  const group = await modelGroup.findOne({ groupName });
  if (!group) {
    throw new Error('Group not existed');
  }
  return {
    ...group,
    members: await (
      await modelUserGroup.find({ groupId: group._id })
    ).toArray(),
  };
}
async function checkUserGroupMembership(
  databaseName: string,
  actor: string,
  groupName: string,
  networkId: NetworkId,
  session?: ClientSession
): Promise<boolean> {
  if (!(await isGroupExist(databaseName, groupName, networkId, session))) {
    throw Error(
      `Group ${groupName} does not exist for database ${databaseName}`
    );
  }

  const modelUserGroup = ModelUserGroup.getInstance(databaseName, networkId);
  const actorGroups = await modelUserGroup.listGroupByUserName(
    actor,
    networkId,
    {
      session,
    }
  );
  return actorGroups.includes(groupName);
}

async function addUserToGroups(
  databaseName: string,
  actor: string,
  groups: string[],
  networkId: NetworkId,
  session?: ClientSession
): Promise<boolean> {
  const modelUserGroup = ModelUserGroup.getInstance(databaseName, networkId);

  const result = await modelUserGroup.addUserToGroup(actor, groups, networkId, {
    session,
  });

  return result.isOk();
}

async function changeGroupDescription(
  databaseName: string,
  actor: string,
  groupName: string,
  newGroupDescription: string,
  networkId: NetworkId,
  session?: ClientSession
): Promise<boolean> {
  if (await isDatabaseOwner(databaseName, actor, networkId, session)) {
    const modelGroup = ModelGroup.getInstance(databaseName, networkId);
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
  networkId: NetworkId,
  session?: ClientSession
): Promise<boolean> {
  if (await isDatabaseOwner(databaseName, actor, networkId, session)) {
    const modelGroup = ModelGroup.getInstance(databaseName, networkId);
    const groupExist = (await modelGroup.findGroup(group, session)) !== null;

    if (groupExist) {
      if (await areUsersExist(users, networkId)) {
        const modelUserGroup = ModelUserGroup.getInstance(
          databaseName,
          networkId
        );
        const result = await modelUserGroup.addUsersToGroup(
          users,
          group,
          networkId,
          {
            session,
          }
        );

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
  networkId: NetworkId,
  session?: ClientSession
): Promise<boolean> {
  if (await isDatabaseOwner(databaseName, actor, networkId, session)) {
    const modelGroup = ModelGroup.getInstance(databaseName, networkId);
    const groupExist = (await modelGroup.findGroup(group, session)) !== null;

    if (groupExist) {
      if (await areUsersExist(users, networkId)) {
        const modelUserGroup = ModelUserGroup.getInstance(
          databaseName,
          networkId
        );
        const result = await modelUserGroup.removeUsersFromGroup(
          users,
          group,
          networkId,
          {
            session,
          }
        );

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
  networkId: NetworkId,
  session?: ClientSession
) {
  if (await isDatabaseOwner(databaseName, actor, networkId, session)) {
    const modelUserGroup = ModelGroup.getInstance(databaseName, networkId);
    const group = await modelUserGroup.findGroup(groupName);
    if (group) {
      await modelUserGroup.collection.updateOne(
        {
          groupName,
          networkId,
        },
        { $set: { groupName: newGroupName } }
      );
    }
    throw Error(`Group ${groupName} does not exist`);
  }

  throw Error('Only database owner allowed to rename group');
}

async function getUsersGroup(
  databaseName: string,
  userName: string,
  networkId: NetworkId,
  session?: ClientSession
): Promise<string[]> {
  // TODO: Check Database Ownership
  return ModelUserGroup.getInstance(databaseName, networkId).listGroupByUserName(userName, networkId, {
    session,
  });
}

export {
  addUsersToGroup,
  addUserToGroups,
  changeGroupDescription,
  checkUserGroupMembership,
  createGroup,
  excludeUsersToGroup,
  getGroupInfo,
  getUsersGroup,
  isGroupExist,
  renameGroup,
};

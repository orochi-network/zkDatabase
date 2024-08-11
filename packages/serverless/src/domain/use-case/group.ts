import { ClientSession } from 'mongodb';
import ModelGroup from '../../model/database/group.js';
import ModelUserGroup from '../../model/database/user-group.js';

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
  if (await isGroupExist(databaseName, groupName, session)) {
    throw Error(
      `Group ${groupName} is already exist for database ${databaseName}`
    );
  }

  const modelGroup = new ModelGroup(databaseName);

  const group = await modelGroup.createGroup(
    groupName,
    groupDescription,
    actor,
    { session }
  );

  return group != null;
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
  // TODO: Check Database Ownership
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

async function addUsersToGroup(
  databaseName: string,
  actor: string,
  group: string,
  users: string[],
  session?: ClientSession
): Promise<boolean> {
  // TODO: Check Database Ownership
  const modelGroup = new ModelGroup(databaseName);
  const groupExist = (await modelGroup.findGroup(group, session)) !== null;

  // TODO: Check if user exists
  if (groupExist) {
    const modelUserGroup = new ModelUserGroup(databaseName);
    const result = await modelUserGroup.addUsersToGroup(users, group, {
      session,
    });

    return result.isOk();
  }

  throw Error(`Group ${group} does not exist`);
}

async function excludeUsersToGroup(
  databaseName: string,
  actor: string,
  group: string,
  users: string[],
  session?: ClientSession
): Promise<boolean> {
  // TODO: Check Database Ownership
  const modelGroup = new ModelGroup(databaseName);
  const groupExist = (await modelGroup.findGroup(group, session)) !== null;

  // TODO: Check if user exists

  if (groupExist) {
    const modelUserGroup = new ModelUserGroup(databaseName);
    const result = await modelUserGroup.removeUsersFromGroup(users, group, {
      session,
    });

    return result.isOk();
  }

  throw Error(`Group ${group} does not exist`);
}


async function getUsersGroup(
  databaseName: string,
  userName: string,
  session?: ClientSession
): Promise<string[]> {
  // TODO: Check Database Ownership
  return new ModelUserGroup(databaseName).listGroupByUserName(userName, {
    session,
  });
}

export {
  addUsersToGroup,
  excludeUsersToGroup,
  getUsersGroup,
  addUserToGroups,
  isGroupExist,
  createGroup,
  checkUserGroupMembership,
  changeGroupDescription,
};

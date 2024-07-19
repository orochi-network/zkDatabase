import { ClientSession } from 'mongodb';
import ModelGroup from '../../model/database/group';
import ModelUserGroup from '../../model/database/user-group';

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

async function addUsersToGroup(
  databaseName: string,
  actor: string,
  group: string,
  users: string[],
  session?: ClientSession
): Promise<boolean> {
  const modelGroup = new ModelGroup(databaseName);
  const groupExist = (await modelGroup.findGroup(group, session)) !== null;

  if (groupExist) {
    const modelUserGroup = new ModelUserGroup(databaseName);
    const result = await modelUserGroup.addUsersToGroup(users, group, {
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
  return new ModelUserGroup(databaseName).listGroupByUserName(userName, {
    session,
  });
}

export {
  addUsersToGroup,
  getUsersGroup,
  addUserToGroups,
  isGroupExist,
  createGroup,
  checkUserGroupMembership,
};

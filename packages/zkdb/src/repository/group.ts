import { GroupDescription } from '../types/group.js';
import { AppContainer } from '../container.js';

export async function addUsersToGroup(
  databaseName: string,
  groupName: string,
  userNames: string[]
) {
  const result = await AppContainer.getInstance().getApiClient().group.addUser({
    databaseName,
    groupName,
    userNames,
  });

  return result.unwrap();
}

export async function excludeUsersFromGroup(
  databaseName: string,
  groupName: string,
  userNames: string[]
) {
  const result = await AppContainer.getInstance().getApiClient().group.removeUser({
    databaseName,
    groupName,
    userNames,
  });

  return result.unwrap();
}

export async function changeGroupDescription(
  databaseName: string,
  groupName: string,
  description: string
) {
  const result =await AppContainer.getInstance().getApiClient().group.updateDescription({
    databaseName,
    groupName,
    groupDescription: description,
  });

  return result.unwrap()
}

export async function getGroupDescription(
  databaseName: string,
  groupName: string
): Promise<GroupDescription> {
  const result = await AppContainer.getInstance().getApiClient().group.info({ databaseName, groupName });

  const groupDescription = result.unwrap();
  return {
    name: groupDescription.name,
    description: groupDescription.description,
    createdAt: new Date(groupDescription.createdAt),
    createdBy: groupDescription.createdBy,
  };
}

export async function renameGroup(
  databaseName: string,
  groupName: string,
  newGroupName: string
): Promise<boolean> {
  const result = await AppContainer.getInstance().getApiClient().group.rename({
    databaseName,
    groupName,
    newGroupName,
  });

  return result.unwrap();
}

export async function getGroups(
  databaseName: string
): Promise<GroupDescription[]> {
  const result = await AppContainer.getInstance().getApiClient().group.list({ databaseName });

  const groups = result.unwrap();

  return groups.map((group) => ({
    name: group.name,
    description: group.description,
    createdAt: new Date(group.createdAt),
    createdBy: group.createdBy,
  }));
}

export async function createGroup(
  databaseName: string,
  groupName: string,
  description: string
) {
  const result = await AppContainer.getInstance().getApiClient().group.create({
    databaseName,
    groupName,
    groupDescription: description,
  });

  return result.unwrap();
}

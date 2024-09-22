import {
  changeGroupDescription as changeGroupDescriptionRequest,
  addUsersToGroup as addUsersToGroupRequest,
  getGroupDescription as getGroupDescriptionRequest,
  removeUsersFromGroup as removeUsersToGroupRequest,
  renameGroup as renameGroupRequest,
  listGroups as listGroupsRequest,
  createGroup as createGroupRequest,
} from '@zkdb/api';
import { GroupDescription } from '../types/group.js';

export async function addUsersToGroup(
  databaseName: string,
  groupName: string,
  userNames: string[]
) {
  const result = await addUsersToGroupRequest({
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
  const result = await removeUsersToGroupRequest({
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
  const result = await changeGroupDescriptionRequest({
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
  const result = await getGroupDescriptionRequest({ databaseName, groupName });

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
  const result = await renameGroupRequest({
    databaseName,
    groupName,
    newGroupName,
  });

  return result.unwrap();
}

export async function getGroups(
  databaseName: string
): Promise<GroupDescription[]> {
  const result = await listGroupsRequest({ databaseName });

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
  const result = await createGroupRequest({
    databaseName,
    groupName,
    groupDescription: description,
  });

  return result.unwrap();
}

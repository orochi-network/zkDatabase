import {
  changeGroupDescription as changeGroupDescriptionRequest,
  addUsersToGroup as addUsersToGroupRequest,
  getGroupDescription as getGroupDescriptionRequest,
  removeUsersFromGroup as removeUsersToGroupRequest,
  renameGroup as renameGroupRequest,
  listGroups as listGroupsRequest,
  createGroup as createGroupRequest,
} from '@zkdb/api';
import { GroupDescription } from '../sdk/types/group.js';

export async function addUsersToGroup(
  databaseName: string,
  groupName: string,
  userNames: string[]
) {
  const result = await addUsersToGroupRequest(
    databaseName,
    groupName,
    userNames
  );

  if (result.type === 'success') {
    return result.data;
  } else {
    throw Error(result.message);
  }
}

export async function excludeUsersFromGroup(
  databaseName: string,
  groupName: string,
  userNames: string[]
) {
  const result = await removeUsersToGroupRequest(
    databaseName,
    groupName,
    userNames
  );

  if (result.type === 'success') {
    return result.data;
  } else {
    throw Error(result.message);
  }
}

export async function changeGroupDescription(
  databaseName: string,
  groupName: string,
  description: string
) {
  const result = await changeGroupDescriptionRequest(
    databaseName,
    groupName,
    description
  );

  if (result.type === 'success') {
    return result.data;
  } else {
    return false;
  }
}

export async function getGroupDescription(
  databaseName: string,
  groupName: string
): Promise<GroupDescription> {
  const result = await getGroupDescriptionRequest(databaseName, groupName);

  if (result.type === 'success') {
    return {
      name: result.data.name,
      description: result.data.description,
      createdAt: new Date(result.data.createdAt),
      createdBy: result.data.createdBy,
    };
  } else {
    throw Error(result.message);
  }
}

export async function renameGroup(
  databaseName: string,
  groupName: string,
  newGroupName: string
): Promise<void> {
  const result = await renameGroupRequest(
    databaseName,
    groupName,
    newGroupName
  );

  if (result.type === 'success') {
    return result.data;
  } else {
    throw Error(result.message);
  }
}

export async function getGroups(
  databaseName: string
): Promise<GroupDescription[]> {
  const result = await listGroupsRequest(databaseName);

  if (result.type === 'success') {
    return result.data.map((group) => ({
      name: group.name,
      description: group.description,
      createdAt: new Date(group.createdAt),
      createdBy: group.createdBy,
    }));
  } else {
    throw Error(result.message);
  }
}

export async function createGroup(
  databaseName: string,
  groupName: string,
  description: string
) {
  const result = await createGroupRequest(databaseName, groupName, description);

  if (result.type === 'error') {
    throw Error(result.message);
  }
}

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
  const result = await addUsersToGroupRequest(
    databaseName,
    groupName,
    userNames
  );

  if (result.isOne()) {
    return result.unwrapObject();
  } else {
    throw result.unwrapError();
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

  if (result.isOne()) {
    return result.unwrapObject();
  } else {
    throw result.unwrapError();
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

  if (result.isOne()) {
    return result.unwrapObject();
  } else {
    throw result.unwrapError();
  }
}

export async function getGroupDescription(
  databaseName: string,
  groupName: string
): Promise<GroupDescription> {
  const result = await getGroupDescriptionRequest(databaseName, groupName);

  if (result.isOne()) {
    const groupDescription = result.unwrapObject();
    return {
      name: groupDescription.name,
      description: groupDescription.description,
      createdAt: new Date(groupDescription.createdAt),
      createdBy: groupDescription.createdBy,
    };
  } else {
    if (result.isError()) {
      throw result.unwrapError();
    } else {
      throw Error('Unknown error');
    }
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

  if (result.isError()) {
    throw result.unwrapError();
  } else {
    throw Error('Unknown error');
  }
}

export async function getGroups(
  databaseName: string
): Promise<GroupDescription[]> {
  const result = await listGroupsRequest(databaseName);

  if (result.isSome()) {
    const groups = result.unwrapArray();

    return groups.map((group) => ({
      name: group.name,
      description: group.description,
      createdAt: new Date(group.createdAt),
      createdBy: group.createdBy,
    }));
  } else {
    if (result.isError()) {
      throw result.unwrapError();
    } else {
      throw Error('Unknown error');
    }
  }
}

export async function createGroup(
  databaseName: string,
  groupName: string,
  description: string
) {
  const result = await createGroupRequest(databaseName, groupName, description);

  if (result.isError()) {
    throw result.unwrapError();
  } else {
    throw Error('Unknown error');
  }
}

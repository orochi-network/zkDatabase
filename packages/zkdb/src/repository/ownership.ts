import { Ownership } from '../types/ownership.js';
import { Permissions } from '../types/permission.js';
import { AppContainer } from '../container.js';

export async function updateCollectionGroupOwnership(
  databaseName: string,
  collectionName: string,
  groupName: string
) {
  const result = await AppContainer.getInstance().getApiClient().ownership.setOwnership({
    databaseName,
    collectionName,
    docId: undefined,
    grouping: 'Group',
    newOwner: groupName,
  });

  return result.unwrap();
}

export async function updateCollectionUserOwnership(
  databaseName: string,
  collectionName: string,
  userName: string
) {
  const result = await AppContainer.getInstance().getApiClient().ownership.setOwnership({
    databaseName,
    collectionName,
    docId: undefined,
    grouping: 'User',
    newOwner: userName,
  });

  return result.unwrap();
}

export async function updateDocumentGroupOwnership(
  databaseName: string,
  collectionName: string,
  docId: string,
  groupName: string
) {
  const result = await AppContainer.getInstance().getApiClient().ownership.setOwnership({
    databaseName,
    collectionName,
    docId,
    grouping: 'Group',
    newOwner: groupName,
  });

  return result.unwrap();
}

export async function updateDocumentUserOwnership(
  databaseName: string,
  collectionName: string,
  docId: string,
  userName: string
) {
  const result = await AppContainer.getInstance().getApiClient().ownership.setOwnership({
    databaseName,
    collectionName,
    docId,
    grouping: 'User',
    newOwner: userName,
  });

  return result.unwrap();
}

export async function getCollectionOwnership(
  databaseName: string,
  collectionName: string
): Promise<Ownership> {
  const result = await AppContainer.getInstance().getApiClient().permission.get({
    databaseName,
    collectionName,
    docId: undefined,
  });

  return result.unwrap();
}

export async function getDocumentOwnership(
  databaseName: string,
  collectionName: string,
  docId: string
): Promise<Ownership> {
  const result = await AppContainer.getInstance().getApiClient().permission.get({ databaseName, collectionName, docId });

  return result.unwrap();
}

export async function setDocumentPermissions(
  databaseName: string,
  collectionName: string,
  docId: string,
  permissions: Permissions
) {
  const remotePermissions = await getDocumentOwnership(
    databaseName,
    collectionName,
    docId
  );

  const result = await AppContainer.getInstance().getApiClient().permission.set({
    databaseName,
    collectionName,
    docId,
    permission: {
      permissionOwner: {
        ...remotePermissions.permissions.permissionOwner,
        ...permissions.permissionOwner,
      },
      permissionGroup: {
        ...remotePermissions.permissions.permissionGroup,
        ...permissions.permissionGroup,
      },
      permissionOther: {
        ...remotePermissions.permissions.permissionOther,
        ...permissions.permissionOther,
      },
    },
  });

  return result.unwrap();
}

export async function setCollectionPermissions(
  databaseName: string,
  collectionName: string,
  permissions: Permissions
) {
  const remotePermissions = await getCollectionOwnership(
    databaseName,
    collectionName
  );

  const result = await AppContainer.getInstance().getApiClient().permission.set({
    databaseName,
    collectionName,
    docId: undefined,
    permission: {
      permissionOwner: {
        ...remotePermissions.permissions.permissionOwner,
        ...permissions.permissionOwner,
      },
      permissionGroup: {
        ...remotePermissions.permissions.permissionGroup,
        ...permissions.permissionGroup,
      },
      permissionOther: {
        ...remotePermissions.permissions.permissionOther,
        ...permissions.permissionOther,
      },
    },
  });

  return result.unwrap();
}

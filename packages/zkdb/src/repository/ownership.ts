import { listPermissions, setOwner, setPermissions } from '@zkdb/api';
import { Ownership } from '../types/ownership.js';
import { Permissions } from '../types/permission.js';

export async function updateCollectionGroupOwnership(
  databaseName: string,
  collectionName: string,
  groupName: string
) {
  const result = await setOwner(
    databaseName,
    collectionName,
    undefined,
    'Group',
    groupName
  );

  if (result.type === 'error') {
    throw Error(result.message);
  }
}

export async function updateCollectionUserOwnership(
  databaseName: string,
  collectionName: string,
  userName: string
) {
  const result = await setOwner(
    databaseName,
    collectionName,
    undefined,
    'User',
    userName
  );

  if (result.type === 'error') {
    throw Error(result.message);
  }
}

export async function updateDocumentGroupOwnership(
  databaseName: string,
  collectionName: string,
  docId: string,
  groupName: string
) {
  const result = await setOwner(
    databaseName,
    collectionName,
    docId,
    'Group',
    groupName
  );

  if (result.type === 'error') {
    throw Error(result.message);
  }
}

export async function updateDocumentUserOwnership(
  databaseName: string,
  collectionName: string,
  docId: string,
  userName: string
) {
  const result = await setOwner(
    databaseName,
    collectionName,
    docId,
    'User',
    userName
  );

  if (result.type === 'error') {
    throw Error(result.message);
  }
}

export async function getCollectionOwnership(
  databaseName: string,
  collectionName: string
): Promise<Ownership> {
  const result = await listPermissions(databaseName, collectionName, undefined);

  if (result.type === 'success') {
    return result.data;
  } else {
    throw Error(result.message);
  }
}

export async function getDocumentOwnership(
  databaseName: string,
  collectionName: string,
  docId: string
): Promise<Ownership> {
  const result = await listPermissions(databaseName, collectionName, docId);

  if (result.type === 'success') {
    return result.data;
  } else {
    throw Error(result.message);
  }
}

export async function setDocumentPermissions(
  databaseName: string,
  collectionName: string,
  docId: string,
  permissions: Permissions
) {
  const remotePermissions = await getDocumentOwnership(databaseName, collectionName, docId);

  const setPermissionsResult = await setPermissions(
    databaseName,
    collectionName,
    docId,
    {
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
    }
  );


  if (setPermissionsResult.type === 'success') {
    return setPermissionsResult.data;
  } else {
    throw Error(setPermissionsResult.message);
  }
}

export async function setCollectionPermissions(
  databaseName: string,
  collectionName: string,
  permissions: Permissions
) {
  const remotePermissions = await getCollectionOwnership(databaseName, collectionName);

  const setPermissionsResult = await setPermissions(
    databaseName,
    collectionName,
    undefined,
    {
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
    }
  );

  if (setPermissionsResult.type === 'success') {
    return setPermissionsResult.data;
  } else {
    throw Error(setPermissionsResult.message);
  }
}
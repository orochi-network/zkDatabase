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

  if (result.isError()) {
    throw result.unwrapError();
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

  if (result.isError()) {
    throw result.unwrapError();
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

  if (result.isError()) {
    throw result.unwrapError();
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

  if (result.isError()) {
    throw result.unwrapError();
  }
}

export async function getCollectionOwnership(
  databaseName: string,
  collectionName: string
): Promise<Ownership> {
  const result = await listPermissions(databaseName, collectionName, undefined);

  if (result.isOne()) {
    return result.unwrapObject();
  } else {
    if (result.isError()) {
      throw result.unwrapError();
    } else {
      throw Error('Unknown error');
    }
  }
}

export async function getDocumentOwnership(
  databaseName: string,
  collectionName: string,
  docId: string
): Promise<Ownership> {
  const result = await listPermissions(databaseName, collectionName, docId);

  if (result.isOne()) {
    return result.unwrapObject();
  } else {
    if (result.isError()) {
      throw result.unwrapError();
    } else {
      throw Error('Unknown error');
    }
  }
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

  const result = await setPermissions(databaseName, collectionName, docId, {
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
  });

  if (result.isOne()) {
    return result.unwrapObject();
  } else {
    if (result.isError()) {
      throw result.unwrapError();
    } else {
      throw Error('Unknown error');
    }
  }
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

  const result = await setPermissions(databaseName, collectionName, undefined, {
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
  });

  if (result.isOne()) {
    return result.unwrapObject();
  } else {
    if (result.isError()) {
      throw result.unwrapError();
    } else {
      throw Error('Unknown error');
    }
  }
}

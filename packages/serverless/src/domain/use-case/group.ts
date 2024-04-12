import { ClientSession } from 'mongodb';
import ModelGroup from '../../model/database/group';

// eslint-disable-next-line import/prefer-default-export
export async function isGroupExist(
  databaseName: string,
  groupName: string
): Promise<boolean> {
  const modelGroup = new ModelGroup(databaseName);

  const group = await modelGroup.findGroup(groupName);

  return group != null;
}

export async function createGroup(
  databaseName: string,
  actor: string,
  groupName: string,
  groupDescription?: string,
  session?: ClientSession
): Promise<boolean> {
  if (await isGroupExist(databaseName, groupName)) {
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

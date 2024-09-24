import { Database, DatabaseSettings } from '../types/database.js';
import { PublicKey } from 'o1js';
import { FilterCriteria } from '../types/common.js';
import { Pagination } from '../types/pagination.js';
import { AppContainer } from '../container.js';

export async function getDatabases(
  filter?: FilterCriteria,
  pagination?: Pagination
): Promise<Database[]> {
  const result = await AppContainer.getInstance().getApiClient().db.list({
    query: filter ?? {},
    pagination: pagination ?? {
      offset: 0,
      limit: 10,
    },
  });

  return result.unwrap();
}

export async function getDatabaseSettings(
  databaseName: string
): Promise<DatabaseSettings> {
  const result = await AppContainer.getInstance().getApiClient().db.setting({ databaseName });
  return result.unwrap();
}

export async function createDatabase(
  databaseName: string,
  merkleHeight: number,
  publicKey: PublicKey
) {
  const result = await AppContainer.getInstance().getApiClient().db.create({
    databaseName,
    merkleHeight,
    publicKey: publicKey.toBase58(),
  });

  return result.unwrap();
}

export async function changeDatabaseOwner(
  databaseName: string,
  newOwner: string
): Promise<boolean> {
  const result = await AppContainer.getInstance().getApiClient().db.transferOwnership({
    databaseName,
    newOwner,
  });

  return result.unwrap();
}

import {
  listDatabases,
  getDatabaseSettings as getDatabaseSettingsRequest,
  createDatabase as createDatabaseRequest,
  changeDatabaseOwner as changeDatabaseOwnerRequest,
} from '@zkdb/api';
import { Database, DatabaseSettings } from '../types/database.js';
import { PublicKey } from 'o1js';
import { QueryOptions } from '../sdk/query/query-builder.js';
import { DatabaseSearch } from '../types/search.js';
import { FilterCriteria } from '../types/common.js';
import { Pagination } from '../types/pagination.js';

export async function getDatabases(
  filter?: FilterCriteria,
  pagination?: Pagination
): Promise<Database[]> {
  const result = await listDatabases({
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
  const result = await getDatabaseSettingsRequest({ databaseName });
  return result.unwrap();
}

export async function createDatabase(
  databaseName: string,
  merkleHeight: number,
  publicKey: PublicKey
) {
  const result = await createDatabaseRequest({
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
  const result = await changeDatabaseOwnerRequest({ databaseName, newOwner });

  return result.unwrap();
}

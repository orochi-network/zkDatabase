import {
  listDatabases,
  getDatabaseSettings as getDatabaseSettingsRequest,
  createDatabase as createDatabaseRequest,
  changeDatabaseOwner as changeDatabaseOwnerRequest
} from '@zkdb/api';
import {
  Database,
  DatabaseSettings,
} from '../types/database.js';
import { PublicKey } from 'o1js';
import { QueryOptions } from '../sdk/query/query-builder.js';
import mapSearchInputToSearch from './mapper/search.js';
import { DatabaseSearch } from '../types/search.js';

export async function getDatabases(
  queryOptions?: QueryOptions<DatabaseSearch>
): Promise<Database[]> {
  const result = await listDatabases(
    queryOptions ? mapSearchInputToSearch(queryOptions.where) : undefined,
    queryOptions?.limit
      ? {
          limit: queryOptions.limit,
          offset: queryOptions.offset ?? 0,
        }
      : undefined
  );
  if (result.type === 'success') {
    return result.data;
  } else {
    throw Error(result.message);
  }
}

export async function getDatabaseSettings(
  databaseName: string
): Promise<DatabaseSettings> {
  const result = await getDatabaseSettingsRequest(databaseName);
  if (result.type === 'success') {
    return result.data;
  } else {
    throw Error(result.message);
  }
}

export async function createDatabase(
  databaseName: string,
  merkleHeight: number,
  publicKey: PublicKey
) {
  const result = await createDatabaseRequest(
    databaseName,
    merkleHeight,
    publicKey.toBase58()
  );

  if (result.type === 'error') {
    throw Error(result.message);
  }
}

export async function changeDatabaseOwner(
  databaseName: string,
  newOwner: string,
) {
  const result = await changeDatabaseOwnerRequest(
    databaseName,
    newOwner
  );

  if (result.type === 'error') {
    throw Error(result.message);
  }
}


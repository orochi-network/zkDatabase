import {
  listDatabases,
  getDatabaseSettings as getDatabaseSettingsRequest,
  createDatabase as createDatabaseRequest,
  changeDatabaseOwner as changeDatabaseOwnerRequest,
} from '@zkdb/api';
import { Database, DatabaseSettings } from '../types/database.js';
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

  if (result.isArray()) {
    return result.unwrapArray();
  } else {
    if (result.isError()) {
      throw result.unwrapError();
    } else {
      throw Error('Unknown error');
    }
  }
}

export async function getDatabaseSettings(
  databaseName: string
): Promise<DatabaseSettings> {
  const result = await getDatabaseSettingsRequest(databaseName);
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

  if (result.isError()) {
    throw result.unwrapError();
  }
}

export async function changeDatabaseOwner(
  databaseName: string,
  newOwner: string
) {
  const result = await changeDatabaseOwnerRequest(databaseName, newOwner);

  if (result.isError()) {
    throw result.unwrapError();
  }
}

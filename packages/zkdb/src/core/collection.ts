import {
  createCollection,
  createIndexes,
  dropIndex,
  existIndex,
  listIndexes,
  setPermission,
} from '../client/index.js';
import { PermissionRecord } from '../common/permission.js';
import { PermissionGroup, Permissions } from '../types/permission.js';
import Document from './document.js';
import { Schema, SchemaDefinition } from './schema.js';

export default class Collection {
  private databaseName: string;
  private collectionName: string;

  constructor(databaseName: string, collectionName: string) {
    this.databaseName = databaseName;
    this.collectionName = collectionName;
  }

  public async create<
    T extends Schema & {
      getSchema(): SchemaDefinition;
    },
  >(schema: T, groupName: string, description: string | undefined, permissions: Permissions): Promise<Collection> {
    const isCreated = (
      await createCollection(
        this.databaseName,
        this.collectionName,
        groupName,
        description,
        schema.getSchema(),
        permissions as any
      )
    ).collectionCreate;

    if (!isCreated) {
      throw Error('Error raised during collection creation');
    }

    return this;
  }

  public document(): Document {
    return new Document(this.databaseName, this.collectionName);
  }

  public async listIndexes(): Promise<string[]> {
    return (await listIndexes(this.databaseName, this.collectionName)).indexes;
  }

  public async hasIndex(indexName: string): Promise<boolean> {
    return (await existIndex(this.databaseName, this.collectionName, indexName))
      .existed;
  }

  public async setIndexes(indexNames: string[]): Promise<boolean> {
    return (
      await createIndexes(this.databaseName, this.collectionName, indexNames)
    ).success;
  }

  public async dropIndex(indexName: string): Promise<boolean> {
    return (await dropIndex(this.databaseName, this.collectionName, indexName))
      .success;
  }

  public async changePermission(
    permissionGroup: PermissionGroup,
    newPermission: PermissionRecord
  ): Promise<Permissions> {
    return (
      await setPermission(
        this.databaseName,
        this.collectionName,
        undefined,
        permissionGroup,
        newPermission
      )
    ).permissions;
  }
}

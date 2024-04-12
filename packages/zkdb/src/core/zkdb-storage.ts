import { DocumentEncoded, Schema, SchemaExtendable } from './schema.js';
import {
  createCollection,
  createDocument,
  readDocument,
  updateDocument,
} from '../client/index.js';
import { Permissions } from '../types/permission.js';
import { PermissionBinary, partialToPermission } from '../common/permission.js';
import { FilterCriteria } from '../types/common.js';
import { MerkleWitness } from '../types/merkle-tree.js';
import { Field } from 'o1js';

export class ZKDatabaseStorage {
  private databaseName: string;
  private collectionName: string;

  get collection(): string {
    return this.collectionName;
  }

  get database(): string {
    return this.collectionName;
  }

  public async createDatabase(name: string, merkleHeight: number) {
    await this.createDatabase(name, merkleHeight);
  }

  public useDatabase(name: string) {
    this.databaseName = name;
  }

  public useCollection(name: string) {
    if (this.databaseName === '') {
      throw Error('Database is not chosen');
    }

    this.collectionName = name;
  }

  public async createCollection(
    collectionName: string,
    schemaClass: SchemaExtendable<any>,
    permissions: Permissions = {}
  ): Promise<boolean> {
    return (
      await createCollection(
        this.databaseName,
        collectionName,
        schemaClass.getSchema(),
        permissions as any
      )
    ).collectionCreate;
  }

  public async saveDocument<
    T extends Schema & { serialize: () => DocumentEncoded },
  >(
    documentInstance: T,
    permissions: Permissions = {}
  ): Promise<MerkleWitness> {
    const permissionOwner = PermissionBinary.fromRecord(
      partialToPermission(permissions.permissionOwner)
    );
    const permissionGroup = PermissionBinary.fromRecord(
      partialToPermission(permissions.permissionGroup)
    );
    const permissionOthers = PermissionBinary.fromRecord(
      partialToPermission(permissions.permissionOther)
    );

    return (
      await createDocument(
        this.databaseName,
        this.collectionName,
        documentInstance.serialize(),
        {
          permissionOwner,
          permissionGroup,
          permissionOthers,
        }
      )
    ).documentCreate.map((witness) => {
      return {
        isLeft: witness.isLeft,
        sibling: Field(witness.sibling),
      };
    });
  }

  public async updateDocument<
    T extends Schema & { serialize: () => DocumentEncoded },
  >(documentInstance: T, filter: FilterCriteria) {
    (
      await updateDocument(
        this.databaseName,
        this.collectionName,
        filter,
        documentInstance.serialize()
      )
    ).documentUpdate.map((witness) => {
      return {
        isLeft: witness.isLeft,
        sibling: Field(witness.sibling),
      };
    });
  }

  public async findDocument<
    T extends {
      new (..._args: any): InstanceType<T>;
      deserialize: (doc: DocumentEncoded) => any;
    },
  >(filter: FilterCriteria, documentSchema: T): Promise<InstanceType<T>> {
    const schema = (
      await readDocument(this.databaseName, this.collectionName, filter)
    ).findDocument;

    return new documentSchema(documentSchema.deserialize(schema));
  }
}

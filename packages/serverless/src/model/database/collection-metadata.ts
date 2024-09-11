import { Document, FindOptions } from 'mongodb';
import {
  ModelCollection,
  ModelGeneral,
  zkDatabaseConstants,
} from '@zkdb/storage';
import { ProvableTypeString } from '../../domain/common/schema.js';
import { PermissionBasic } from '../../common/permission.js';

// Every data type will be treaded as string when store/transfer
/*
const exampleSchemaDef: SchemaDef = {
  collection: 'myCollection',
  fields: ['name', 'age'],
  createdAt: new Date(),
  updatedAt: new Date(),
  system: false,
  insert: true,
  read: true,
  write: true,
  delete: false,
  name: {
    order: 0,
    name: 'name',
    type: 'Field',
    indexed: true
  },
  age: {
    order: 1,
    name: 'age',
    type: 'number',
    indexed: false
  }
};
*/

export type SchemaField = {
  order: number;
  name: string;
  kind: ProvableTypeString;
  value: any;
  indexed: boolean;
};

export type SchemaBasic = {
  collection: string;
  fields: string[];
  createdAt: Date;
  updatedAt: Date;
};

export type SchemaFieldDef = Omit<SchemaField, 'value'>;

export type SchemaBuilder = Pick<SchemaField, 'name' | 'kind' | 'indexed'>;

export interface SchemaDefinition
  extends Document,
    SchemaBasic,
    PermissionBasic {
  // SchemaFieldDef
  [key: string]: any;
}

export type SchemaDefBuilder = {
  schemas: SchemaBuilder[];
  permission: PermissionBasic;
};

export type SchemaIndex<T> = {
  [Property in keyof T as `${string & Property}.name`]: string;
};

export class ModelCollectionMetadata extends ModelGeneral<SchemaDefinition> {
  private static collectionName: string =
    zkDatabaseConstants.databaseCollections.schema;

  private static instances: { [key: string]: any } = {};

  public static isValidCollectionName(collectionName: string) {
    if (/^_zkdatabase/i.test(collectionName)) {
      throw new Error('Collection name is invalid');
    }
  }

  private constructor(databaseName: string) {
    super(databaseName, ModelCollectionMetadata.collectionName);
  }

  public static getInstance(databaseName: string): ModelCollectionMetadata {
    if (
      typeof ModelCollectionMetadata.instances[databaseName] === 'undefined'
    ) {
      ModelCollectionMetadata.instances[databaseName] =
        new ModelCollectionMetadata(databaseName);
    }
    return ModelCollectionMetadata.instances[databaseName];
  }

  public async getMetadata(
    collectionName: string,
    options?: FindOptions
  ): Promise<SchemaDefinition> {
    return this.findOne(
      {
        collection: collectionName,
      },
      options
    ) as any;
  }

  public static async init(databaseName: string) {
    const collection = ModelCollection.getInstance(
      databaseName,
      ModelCollectionMetadata.collectionName
    );
    if (!(await collection.isExist())) {
      await collection.index({ collection: 1 }, { unique: true });
    }
  }
}

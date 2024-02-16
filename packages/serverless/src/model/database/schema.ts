import { O1DataType } from '../../common/o1js';
import { PermissionBasic } from '../../common/permission';
import ModelGeneral from '../abstract/general';
import { ZKDATABASE_SCHEMA_COLLECTION } from '../../common/const';
import ModelCollection from '../abstract/collection';
import ModelDocument from '../abstract/document';
import { getCurrentTime } from '../../helper/common';

export type SchemaField = {
  order: number;
  name: string;
  type: O1DataType;
  value: string;
  indexed: boolean;
};

export type SchemaBasic = {
  collection: string;
  fields: string[];
  createdAt: Date;
  updatedAt: Date;
};

export type SchemaFieldDef = Omit<SchemaField, 'value'>;

export type SchemaBuilder = Pick<SchemaField, 'name' | 'type' | 'indexed'>;

export type SchemaDef = SchemaBasic &
  PermissionBasic & {
    [key: string]: SchemaFieldDef;
  };

export type SchemaDefBuilder = {
  schemas: SchemaBuilder[];
  permission: PermissionBasic;
};

export type SchemaIndex<T> = {
  [Property in keyof T as `${string & Property}.name`]: string;
};

export class ModelSchema extends ModelGeneral {
  static collectionName: string = ZKDATABASE_SCHEMA_COLLECTION;

  private static instances: { [key: string]: ModelSchema } = {};

  public static isValidCollectionName(collectionName: string) {
    if (/^\_zkdatabase/i.test(collectionName)) {
      throw new Error('Collection name is invalid');
    }
  }

  private constructor(databaseName: string) {
    super(databaseName, ModelSchema.collectionName);
  }

  public static getInstance(databaseName: string) {
    if (typeof ModelSchema.instances[databaseName] === 'undefined') {
      ModelSchema.instances[databaseName] = new ModelSchema(databaseName);
    }
    return ModelSchema.instances[databaseName];
  }

  public getDocument(collectionName: string) {
    ModelSchema.isValidCollectionName(collectionName);
    return new ModelDocument(this.databaseName, collectionName);
  }

  public async createSchema(
    collectionName: string,
    schemaBuilder: SchemaDefBuilder
  ) {
    ModelSchema.isValidCollectionName(collectionName);
    const schemaDef: SchemaDef = {
      collection: collectionName,
      ...schemaBuilder.permission,
      fields: [],
      createdAt: getCurrentTime(),
      updatedAt: getCurrentTime(),
    } as any;
    const indexKeys = [];
    for (let i = 0; i < schemaBuilder.schemas.length; i += 1) {
      const { name, type, indexed } = schemaBuilder.schemas[i];
      schemaDef.fields.push(name);
      schemaDef[name] = {
        order: i,
        name,
        type,
        indexed,
      };
      if (indexed) {
        indexKeys.push(`${name}.value`);
      }
    }
    // Create index and collection
    await new ModelCollection(this.databaseName, collectionName).create(
      indexKeys
    );
    return this.insertOne(schemaDef);
  }
}

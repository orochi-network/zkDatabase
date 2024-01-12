import { optional } from 'joi';
import { O1DataType } from '../../common/o1js';
import { PermissionBasic } from '../../common/permission';
import { ZKDatabaseIndex } from '../abstract/database-engine';
import ModelGeneral from '../abstract/general';
import { ZKDATABASE_SCHEMA_COLLECTION } from '../../common/const';
import ModelCollection from '../abstract/collection';
import ModelDocument from '../abstract/document';

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

export type SchemaDocument = SchemaDef & ZKDatabaseIndex;

export class ModelSchemaManegement extends ModelGeneral {
  private static instances: { [key: string]: ModelSchemaManegement } = {};

  private constructor(databasName: string) {
    super(databasName, ZKDATABASE_SCHEMA_COLLECTION);
  }

  public getDocumentSchema(collectionName: string) {
    if (/^\_zkdatabase/i.test(collectionName)) {
      throw new Error('Collection name is invalid');
    }
    return new ModelDocument(collectionName);
  }

  public static getInstance(databaseName: string) {
    if (typeof ModelSchemaManegement.instances[databaseName] === 'undefined') {
      ModelSchemaManegement.instances[databaseName] = new ModelSchemaManegement(
        databaseName
      );
    }
    return ModelSchemaManegement.instances[databaseName];
  }

  public async newSchema(
    collectionName: string,
    schemaBuilder: SchemaDefBuilder
  ) {
    if (/^\_zkdatabase/i.test(collectionName)) {
      throw new Error('Collection name is invalid');
    }
    const schemaDef: SchemaDef = {
      collection: collectionName,
      ...schemaBuilder.permission,
      fields: [],
      createdAt: new Date(),
      updatedAt: new Date(),
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

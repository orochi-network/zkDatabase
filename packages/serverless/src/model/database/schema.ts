import Joi from 'joi';
import { ProvableTypeString } from '../common/schema';
import { PermissionBasic } from '../../common/permission';
import ModelGeneral from '../abstract/general';
import { ZKDATABASE_SCHEMA_COLLECTION } from '../../common/const';
import ModelCollection from '../abstract/collection';
import { getCurrentTime } from '../../helper/common';
import { DocumentPermission, DocumentRecord } from '../abstract/document';
import logger from '../../helper/logger';

const schemaVerification: Map<ProvableTypeString, Joi.Schema> = new Map();

// Every data type will be treaded as string when store/transfer
if (schemaVerification.size === 0) {
  schemaVerification.set('CircuitString', Joi.string().length(1024));
  schemaVerification.set('UInt32', Joi.string().pattern(/^[0-9]{1,10}$/));
  schemaVerification.set('UInt64', Joi.string().pattern(/^[0-9]{1,20}$/));
  schemaVerification.set('Bool', Joi.string().valid('true', 'false'));
  schemaVerification.set('Sign', Joi.string().length(256));
  // O1js don't support UTF-8 or Unicode
  schemaVerification.set('Character', Joi.string().length(1));
  schemaVerification.set(
    'Int64',
    Joi.string()
      .pattern(/^(-|)[0-9]{1,20}$/)
      .length(64)
  );
  schemaVerification.set('Field', Joi.string().length(256));
  schemaVerification.set('PrivateKey', Joi.string().length(256));
  schemaVerification.set('PublicKey', Joi.string().length(256));
  schemaVerification.set('Signature', Joi.string().length(256));
  schemaVerification.set('MerkleMapWitness', Joi.string());
}

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

export type SchemaBuilder = Pick<SchemaField, 'name' | 'kind' | 'indexed'>;

export interface SchemaDefinition
  extends Document,
    SchemaBasic,
    DocumentPermission {
  //SchemaFieldDef
  [key: string]: any;
}

export type SchemaDefBuilder = {
  schemas: SchemaBuilder[];
  permission: PermissionBasic;
};

export type SchemaIndex<T> = {
  [Property in keyof T as `${string & Property}.name`]: string;
};

export class ModelSchema extends ModelGeneral<SchemaDefinition> {
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

  public static validateDocument(
    schema: SchemaDefinition,
    document: DocumentRecord
  ) {
    return ModelSchema.validateFields(schema.fields, schema, document);
  }

  public static validateUpdate(
    schema: SchemaDefinition,
    document: DocumentRecord
  ) {
    return ModelSchema.validateFields(Object.keys(document), schema, document);
  }

  private static validateFields(
    fields: string[],
    schema: SchemaDefinition,
    document: DocumentRecord
  ): boolean {
    let result = true;
    for (let i = 0; i < fields.length; i += 1) {
      const field = fields[i];
      const kind = schema[field].kind;
      // Check if kind is supported
      if (schemaVerification.has(kind) === false) {
        throw new Error(`Schema kind ${kind} is not supported`);
      }
      // Check field is exist on document
      if (typeof document[field] === 'undefined') {
        throw new Error(`Document is missing field ${field}`);
      }
      const { error } = schemaVerification.get(kind)!.validate(document[field]);
      if (error) {
        logger.error('Schema validation error:', error);
        result = false;
      }
    }
    return result;
  }

  public async createSchema(
    collectionName: string,
    schemaBuilder: SchemaDefBuilder
  ) {
    ModelSchema.isValidCollectionName(collectionName);
    const schemaDef: any = {
      collection: collectionName,
      ...schemaBuilder.permission,
      fields: [],
      createdAt: getCurrentTime(),
      updatedAt: getCurrentTime(),
    };
    const indexKeys = [];
    for (let i = 0; i < schemaBuilder.schemas.length; i += 1) {
      const { name, kind, indexed } = schemaBuilder.schemas[i];
      schemaDef.fields.push(name);
      schemaDef[name] = {
        order: i,
        name,
        kind,
        indexed,
      };
      if (indexed) {
        indexKeys.push(`${name}.name`);
      }
    }
    // Create index and collection
    await new ModelCollection(this.databaseName, collectionName).create(
      indexKeys
    );
    return this.insertOne(schemaDef);
  }

  public async getSchema(collectionName: string): Promise<SchemaDef> {
    return this.findOne({
      collection: collectionName,
    }) as any;
  }

  public static async init(databaseName: string) {
    const collection = ModelCollection.getInstance(
      databaseName,
      ModelSchema.collectionName
    );
    if (!(await collection.isExist())) {
      await collection.create({ collection: 1 }, { unique: true });
    }
  }
}

import { logger } from '@helper';
import { ModelCollectionMetadata } from '@model';
import Joi from 'joi';
import { ClientSession } from 'mongodb';
import {
  ProvableTypeMap,
  ProvableTypeString,
  Schema,
  SchemaEncoded,
} from '../common';
import { DocumentFields, DocumentSchema } from '../types';

const schemaVerification: Map<ProvableTypeString, Joi.Schema> = new Map();

// Every data type will be treaded as string when store/transfer
if (schemaVerification.size === 0) {
  schemaVerification.set('CircuitString', Joi.string().max(1024));
  schemaVerification.set('UInt32', Joi.string().pattern(/^[0-9]{1,10}$/));
  schemaVerification.set('UInt64', Joi.string().pattern(/^[0-9]{1,20}$/));
  schemaVerification.set('Bool', Joi.string().valid('true', 'false'));
  schemaVerification.set('Sign', Joi.string().max(256));
  // O1js don't support UTF-8 or Unicode
  schemaVerification.set('Character', Joi.string().length(1));
  schemaVerification.set(
    'Int64',
    Joi.string()
      .pattern(/^(-|)[0-9]{1,20}$/)
      .max(64)
  );
  schemaVerification.set('Field', Joi.string().max(256));
  schemaVerification.set('PrivateKey', Joi.string().max(256));
  schemaVerification.set('PublicKey', Joi.string().max(256));
  schemaVerification.set('Signature', Joi.string().max(256));
  schemaVerification.set('MerkleMapWitness', Joi.string());
}

// eslint-disable-next-line import/prefer-default-export
export async function validateDocumentSchema(
  databaseName: string,
  collectionName: string,
  document: DocumentFields,
  session?: ClientSession
): Promise<boolean> {
  const modelSchema = ModelCollectionMetadata.getInstance(databaseName);
  const schema = await modelSchema.getMetadata(collectionName, { session });

  if (schema === null) {
    throw new Error('Schema not found');
  }

  const schemaFieldNames = new Set(
    schema.fields.filter((name) => name !== '_id')
  );

  const allFieldsDefined = document.every((docField) =>
    schemaFieldNames.has(docField.name)
  );
  if (!allFieldsDefined) {
    document.forEach((docField) => {
      if (!schemaFieldNames.has(docField.name)) {
        logger.error(
          `Document contains an undefined field '${docField.name}'.`
        );
      }
    });
    return false;
  }

  const isValid = schema.fields.every((field) => {
    // Skip validation for the _id field
    if (field === '_id') {
      return true;
    }

    const schemaField = schema[field];

    if (!schemaField) {
      logger.error(`Field '${field}' is not defined in the schema.`);
      return false;
    }

    const { kind } = schemaField;
    const validationSchema = schemaVerification.get(kind);

    if (!validationSchema) {
      logger.error(`Schema kind '${kind}' is not supported.`);
      return false;
    }

    const documentField = document.find((f) => f.name === field);

    if (typeof documentField === 'undefined') {
      logger.error(`Document is missing field '${field}'.`);
      return false;
    }

    if (documentField.kind !== schemaField.kind) {
      logger.error(
        `Field '${field}' has incorrect kind: expected '${kind}', got '${documentField.kind}'.`
      );
      return false;
    }

    const { error } = validationSchema.validate(documentField.value);
    if (error) {
      logger.error(
        `Schema validation error for field '${field}': ${error.message}`
      );
      return false;
    }

    return true;
  });

  return isValid;
}

export async function buildSchema(
  databaseName: string,
  collectionName: string,
  document: DocumentFields,
  session?: ClientSession
) {
  if (!(await validateDocumentSchema(databaseName, collectionName, document))) {
    throw new Error('Invalid schema');
  }

  const modelSchema = ModelCollectionMetadata.getInstance(databaseName);
  const schema = await modelSchema.getMetadata(collectionName, { session });

  if (schema === null) {
    throw new Error('Schema not found');
  }

  const encodedDocument: SchemaEncoded = [];
  const structType: { [key: string]: any } = {};
  const indexes: string[] = [];

  if (!schema) {
    throw new Error('Schema not found');
  }

  schema.fields.forEach((fieldName) => {
    const documentField = document.find((f) => f.name === fieldName);

    if (!documentField) {
      throw new Error(`Field ${fieldName} not found in document`);
    }

    const { name, kind, value } = documentField;
    structType[name] = ProvableTypeMap[kind as ProvableTypeString];
    encodedDocument.push({ name, kind, value });

    if (schema[fieldName].indexed) {
      indexes.push(name);
    }
  });

  const structuredSchema = Schema.create(structType, indexes);

  return structuredSchema.deserialize(encodedDocument);
}

export async function getSchemaDefinition(
  databaseName: string,
  collectionName: string,
  session?: ClientSession
): Promise<DocumentSchema> {
  const modelSchema = ModelCollectionMetadata.getInstance(databaseName);
  const schema = await modelSchema.getMetadata(collectionName, { session });

  if (!schema) {
    throw new Error('Schema not found');
  }

  return schema.fields.map((f) => schema[f]);
}

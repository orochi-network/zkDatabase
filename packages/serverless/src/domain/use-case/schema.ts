import Joi from 'joi';
import { ClientSession } from 'mongodb';
import logger from '../../helper/logger.js';
import { ModelCollectionMetadata } from '../../model/database/collection-metadata.js';
import {
  ProvableTypeMap,
  ProvableTypeString,
  Schema,
  SchemaEncoded,
} from '../common/schema.js';
import { DocumentFields } from '../types/document.js';
import { DocumentSchema } from '../types/schema.js';
import { listIndexes } from './collection.js';
import { hasCollectionPermission } from './permission.js';

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
    throw new Error(`Schema not found for collection ${collectionName}`);
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
    throw new Error(`Schema not found for collection ${collectionName}`);
  }

  const encodedDocument: SchemaEncoded = [];
  const structType: { [key: string]: any } = {};

  if (!schema) {
    throw new Error(`Schema not found for collection ${collectionName}`);
  }

  schema.fields.forEach((fieldName) => {
    const documentField = document.find((f) => f.name === fieldName);

    if (!documentField) {
      throw new Error(`Field ${fieldName} not found in document`);
    }

    const { name, kind, value } = documentField;
    structType[name] = ProvableTypeMap[kind as ProvableTypeString];
    encodedDocument.push({ name, kind, value });
  });

  const structuredSchema = Schema.create(structType);

  return structuredSchema.deserialize(encodedDocument);
}

export async function getSchemaDefinition(
  databaseName: string,
  collectionName: string,
  actor: string,
  session?: ClientSession
): Promise<DocumentSchema> {
  if (
    !(await hasCollectionPermission(
      databaseName,
      collectionName,
      actor,
      'read',
      session
    ))
  ) {
    throw new Error(
      `Access denied: Actor '${actor}' does not have 'read' permission for collection '${collectionName}'.`
    );
  }

  const modelSchema = ModelCollectionMetadata.getInstance(databaseName);
  const schema = await modelSchema.getMetadata(collectionName, { session });

  const indexes = await listIndexes(databaseName, actor, collectionName);

  if (!schema) {
    throw new Error(`Schema not found for collection ${collectionName}`);
  }

  return schema.fields.map((f) => ({
    ...schema[f],
    indexed: indexes.some((index) => index === f),
  }));
}

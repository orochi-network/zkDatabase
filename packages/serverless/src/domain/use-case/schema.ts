import {
  ProvableTypeMap,
  Schema,
  TContractSchemaField,
  TDocumentField,
  TProvableTypeString,
} from '@zkdb/common';
import Joi from 'joi';
import { ClientSession } from 'mongodb';
import logger from '../../helper/logger.js';
import { ModelMetadataCollection } from '../../model/database/metadata-collection.js';

const schemaVerification: Map<TProvableTypeString, Joi.Schema> = new Map();

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
  document: TDocumentField[],
  session?: ClientSession
): Promise<boolean> {
  const modelMetadataCollection =
    ModelMetadataCollection.getInstance(databaseName);
  const metadata = await modelMetadataCollection.getMetadata(collectionName, {
    session,
  });

  if (!metadata) {
    throw new Error(`Metadata not found for collection ${collectionName}`);
  }

  const schemaFieldSet = new Set(
    metadata.schema.map((s) => s.name).filter((name) => name !== '_id')
  );

  const allFieldsDefined = document.every((docField) =>
    schemaFieldSet.has(docField.name)
  );

  if (!allFieldsDefined) {
    document.forEach((docField) => {
      if (!schemaFieldSet.has(docField.name)) {
        logger.error(
          `Document contains an undefined field '${docField.name}'.`
        );
      }
    });
    return false;
  }
  // schema = metadata.field
  const isValid = metadata.schema.every((sch) => {
    // Skip validation for the _id field
    if (sch.name === '_id') {
      return true;
    }

    const { kind } = sch;
    const validationSchema = schemaVerification.get(kind);

    if (!validationSchema) {
      logger.error(`Schema kind '${kind}' is not supported.`);
      return false;
    }

    const documentField = document.find((f) => f.name === sch.name);

    if (typeof documentField === 'undefined') {
      logger.error(`Document is missing field '${sch.name}'.`);
      return false;
    }

    if (documentField.kind !== sch.kind) {
      logger.error(
        `Field '${sch.name}' has incorrect kind: expected '${kind}', got '${documentField.kind}'.`
      );
      return false;
    }

    const { error } = validationSchema.validate(documentField.value);
    if (error) {
      logger.error(
        `Schema validation error for field '${sch.name}': ${error.message}`
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
  document: TDocumentField[],
  session?: ClientSession
) {
  if (!(await validateDocumentSchema(databaseName, collectionName, document))) {
    throw new Error('Invalid schema');
  }

  const modelMetadataCollection =
    ModelMetadataCollection.getInstance(databaseName);
  const metadata = await modelMetadataCollection.getMetadata(collectionName, {
    session,
  });

  if (!metadata) {
    throw new Error(`Metadata not found for collection ${collectionName}`);
  }

  const encodedDocument: TContractSchemaField[] = [];
  const structType: { [key: string]: any } = {};

  metadata.schema.forEach((sch) => {
    const documentField = document.find((f) => f.name === sch.name);

    if (!documentField) {
      throw new Error(`Field ${sch.name} not found in document`);
    }

    const { name, kind, value } = documentField;
    structType[name] = ProvableTypeMap[kind as TProvableTypeString];
    encodedDocument.push({ name, kind, value });
  });

  const structuredSchema = Schema.create(structType);

  return structuredSchema.deserialize(encodedDocument);
}

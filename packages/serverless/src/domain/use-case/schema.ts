import {
  PROVABLE_TYPE_MAP,
  Schema,
  TSchemaSerializedField,
  TDocumentField,
  TProvableTypeString,
} from '@zkdb/common';
import Joi from 'joi';
import { ClientSession } from 'mongodb';
import { logger } from '@helper';
import { ModelMetadataCollection } from '@model';

const schemaVerification: Map<TProvableTypeString, Joi.Schema> = new Map();

// NOTE: not used but keeping here for reference
// TODO: remove when synchronized with the upper level validators
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

  // TODO: consider throwing error for better error messages to end user,
  // instead of simply logging the error
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

  // TODO(wonrax): I removed the field type validation using the
  // `schemaVerification` map above because the data types are already
  // validated in the upper graphql level. However some manual testing and
  // verfication is needed to ensure the data types are correctly validated and
  // there exists no edge cases.

  return true;
}

export async function buildSchema(
  databaseName: string,
  collectionName: string,
  document: TDocumentField[],
  session?: ClientSession
) {
  // TODO: refactor validateDocumentSchema to accept metadata as an argument
  // instead of fetching it again
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

  const encodedDocument: TSchemaSerializedField[] = [];
  const structType: { [key: string]: any } = {};

  metadata.schema.forEach((sch) => {
    const documentField = document.find((f) => f.name === sch.name);

    if (!documentField) {
      throw new Error(`Field ${sch.name} not found in document`);
    }

    const { name, kind } = documentField;
    structType[name] = PROVABLE_TYPE_MAP[kind as TProvableTypeString];
    encodedDocument.push(documentField);
  });

  const structuredSchema = Schema.create(structType);

  return structuredSchema.deserialize(encodedDocument);
}

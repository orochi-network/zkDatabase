import {
  PROVABLE_TYPE_MAP,
  Schema as O1Schema,
  TSchemaSerializedField,
  TDocumentField,
  TProvableTypeString,
  TCollectionMetadataRecord,
  TSerializedValue,
} from '@zkdb/common';
import Joi from 'joi';

const schemaVerification: Map<TProvableTypeString, Joi.Schema> = new Map();

// NOTE: not used but keeping here for reference
// TODO: remove when synchronized with the upper level validators
// Every data type will be treaded as string when store/transfer
if (schemaVerification.size === 0) {
  const base58String = Joi.string()
    .max(256)
    // Base58 string
    // https://datatracker.ietf.org/doc/html/draft-msporny-base58-03#page-3
    .pattern(/^[123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz]+$/);

  schemaVerification.set('CircuitString', Joi.string().max(1024));
  schemaVerification.set('UInt32', Joi.number().positive());
  schemaVerification.set('UInt64', Joi.string().pattern(/^[0-9]{1,20}$/));
  schemaVerification.set('Bool', Joi.boolean());
  schemaVerification.set('Sign', Joi.boolean());
  // O1js don't support UTF-8 or Unicode
  schemaVerification.set('Character', Joi.string().length(1));
  schemaVerification.set(
    'Int64',
    Joi.string()
      .pattern(/^(-|)[0-9]{1,20}$/)
      .max(64)
  );
  schemaVerification.set('Field', Joi.string().max(256));
  schemaVerification.set('PrivateKey', base58String);
  schemaVerification.set('PublicKey', base58String);
  schemaVerification.set('Signature', base58String);
  schemaVerification.set('MerkleMapWitness', Joi.string());
}

/** Represents a document that has been verified to conform to the metadata
 * schema (includes data types and ordering). This type helps prevent redundant
 * schema validation checks and ensures only the verified document is passed to
 * the `buildSchema` function. */
export type TValidatedDocument = Array<
  TDocumentField & {
    validated: true;
  }
>;

export class Schema {
  /** Validates the document against the metadata schema, returning a validated
   * document that has been checked for data types and field ordering. */
  static validateDocumentSchema(
    collectionMetadata: TCollectionMetadataRecord,
    document: Record<string, TSerializedValue>
  ): TValidatedDocument {
    const schemaFieldSet = new Set(
      collectionMetadata.schema
        .map((s) => s.name)
        .filter((name) => name !== '_id')
    );

    Object.entries(document).forEach(([fieldName, fieldValue]) => {
      if (!schemaFieldSet.has(fieldName)) {
        throw new Error(`Field ${fieldName} not found in schema`);
      }
      schemaFieldSet.delete(fieldName);
    });

    if (schemaFieldSet.size > 0) {
      throw new Error(
        `Fields ${Array.from(schemaFieldSet).join(', ')} missing in document, which are required by the schema`
      );
    }

    // Validate the value of each field
    return collectionMetadata.schema.map((schemaField) => {
      const { error, value } = schemaVerification
        .get(schemaField.kind)!!
        .validate(document[schemaField.name]);

      if (error) {
        throw new Error(
          `Field ${schemaField.name} of kind ${schemaField.kind} failed validation: ${error}`
        );
      }

      return {
        name: schemaField.name,
        value,
        kind: schemaField.kind,
        validated: true,
      };
    });

    // TODO(wonrax): I removed the field type validation using the
    // `schemaVerification` map above because the data types are already
    // validated in the upper graphql level. However some manual testing and
    // verfication is needed to ensure the data types are correctly validated and
    // there exists no edge cases.
    //
    // TODO(wonrax): Update - I was wrong, we need to validate that the data
    // types in the document match the corresponding data types defined in the
    // metadata schema. The fix is to:
    // 1. Remove the kind field when creating or updating documents. This forces
    // us to rely on the metadata schema for the data type.
    // 2. Validate that the serialized data type of each field in the document
    // matches the data type defined in the metadata schema, e.g. using Joi.
  }

  static buildSchema(document: TValidatedDocument) {
    const encodedDocument: TSchemaSerializedField[] = [];
    const structType: { [key: string]: any } = {};

    document.forEach((field) => {
      const documentField = document.find((f) => f.name === field.name);

      if (!documentField) {
        throw new Error(`Field ${field.name} not found in document`);
      }

      const { name, kind } = documentField;
      structType[name] = PROVABLE_TYPE_MAP[kind as TProvableTypeString];
      encodedDocument.push(documentField);
    });

    const structuredSchema = O1Schema.create(structType);

    return structuredSchema.deserialize(encodedDocument);
  }
}

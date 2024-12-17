import { ESorting, ETransactionType, TDocumentField } from '@types';
import { Permission } from '@zkdb/permission';
import Joi from 'joi';

export const O1JS_VALID_TYPE = [
  'CircuitString',
  'UInt32',
  'UInt64',
  'Bool',
  'Sign',
  'Character',
  'Int64',
  'Field',
  'PrivateKey',
  'PublicKey',
  'Signature',
  'MerkleMapWitness',
];

export const ESortingSchema = (required: true) => {
  const joiSorting = Joi.string().valid(ESorting.Asc, ESorting.Desc);
  return required ? joiSorting.required() : joiSorting.optional();
};

export const objectId = Joi.string()
  .trim()
  .min(36)
  .max(36)
  .required()
  .pattern(/^[a-f0-9]+/i);

export const userName = Joi.string()
  .trim()
  .min(4)
  .max(128)
  .required()
  .pattern(/^[a-z]+[._a-z0-9]+/i);

export const collectionName = Joi.string()
  .trim()
  .min(4)
  .max(128)
  .required()
  .pattern(/^[a-z]+[_a-z0-9]+/i);

export const groupName = (required: boolean = true) => {
  const joiGroupName = Joi.string()
    .trim()
    .min(4)
    .max(128)
    .required()
    .pattern(/^[a-z]+[_a-z0-9]+/i);
  return required ? joiGroupName.required() : joiGroupName.optional();
};

export const groupDescription = (required: boolean = true) => {
  const joiGroupDescription = Joi.string().max(512);
  return required
    ? joiGroupDescription.min(10).required()
    : joiGroupDescription.min(0).optional();
};

export const publicKey = Joi.string()
  .trim()
  .length(55)
  .required()
  .pattern(/^[A-HJ-NP-Za-km-z1-9]{55}$/);

export const indexNumber = Joi.string()
  .regex(/^[0-9]+$/)
  .required();

export const index = Joi.array().items(Joi.string().required());

// TODO: write tests
export const documentField = Joi.object<TDocumentField, true>()
  .custom((raw, helpers) => {
    const { value: name, error: nameError } = Joi.string()
      .pattern(/^[a-z][a-zA-Z0-9\\_]+$/)
      .validate(raw.name);
    if (nameError) {
      return nameError;
    }

    const { value: kind, error: kindError } = Joi.string().validate(raw.kind);
    if (kindError) {
      return kindError;
    }

    let field: Omit<TDocumentField, 'name'>;

    switch (kind) {
      case 'PrivateKey':
      case 'PublicKey':
      case 'Signature': {
        let { value, error } = Joi.string()
          .max(256)
          // Base58 string
          // https://datatracker.ietf.org/doc/html/draft-msporny-base58-03#page-3
          .pattern(
            /^[123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz]+$/
          )
          .validate(raw.value);
        if (error) {
          return error;
        }
        field = { kind, value };
        break;
      }
      case 'Field':
      case 'CircuitString':
      case 'Character': {
        const { value, error } = Joi.string().validate(raw.value);
        if (error) {
          return error;
        }
        field = { kind, value };
        break;
      }
      case 'UInt32':
      case 'Int64':
      case 'UInt64': {
        if (typeof raw.value !== 'string' || typeof raw.value !== 'number') {
          return helpers.error(
            'Value must be a number or a string representing a number'
          );
        }

        try {
          const value = BigInt(raw.value);
          field = { kind, value };
          break;
        } catch (e) {
          if (e instanceof Error) {
            return helpers.error(e.message);
          }
          throw e;
        }
      }
      case 'Bool':
      case 'Sign': {
        const { value, error } = Joi.boolean().validate(raw.value);
        if (error) {
          return error;
        }
        field = { kind, value };
        break;
      }
      default:
        return helpers.error(`Unsupported kind: ${kind}`);
    }

    return { name, ...field };
  })
  .unknown(false);

// TODO: write tests
export const documentRecord = Joi.object<
  Record<string, TDocumentField>,
  true
>().custom((raw, helpers) => {
  if (typeof raw !== 'object' || raw === null) {
    return helpers.error('Document must be an object');
  }

  const final: Record<string, TDocumentField> = {};

  for (const [name, field] of Object.entries(raw)) {
    const { value, error } = documentField.validate(field);
    if (error) {
      return error;
    }

    if (name !== value.name) {
      return helpers.error(
        `Field name mismatch: have key ${name} but field name is ${value.name}`
      );
    }

    final[name] = value;
  }

  return final;
});

export const transactionType = Joi.string().valid(
  ...Object.values(ETransactionType)
);

export const databaseName = Joi.string()
  .trim()
  .min(4)
  .max(128)
  .required()
  .pattern(/^[a-z]+[_a-z0-9]+/i);

export const merkleHeight = Joi.number().integer().positive().required();

export const PERMISSION_DEFAULT_VALUE = Permission.policyStrict();

export * from './collection';
export * from './common';

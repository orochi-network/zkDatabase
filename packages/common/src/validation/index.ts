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

export const ESortingSchema = Joi.string().valid(ESorting.Asc, ESorting.Desc);

export const IndexSchema = Joi.object()
  .pattern(Joi.string(), ESortingSchema) // Keys are strings, values must be 'Asc' or 'Desc'
  .required();

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

export const groupName = Joi.string()
  .trim()
  .min(4)
  .max(128)
  .required()
  .pattern(/^[a-z]+[_a-z0-9]+/i);

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

export const documentField = Joi.object<TDocumentField>({
  name: Joi.string()
    .pattern(/^[a-z][a-zA-Z0-9\\_]+$/)
    .required(),
  kind: Joi.string()
    .valid(...O1JS_VALID_TYPE)
    .required(),
  value: Joi.string().raw().required(),
});

export const transactionType = Joi.string().valid(
  ...Object.values(ETransactionType)
);

export const PERMISSION_DEFAULT_VALUE = Permission.policyStrict().value;

export * from './collection';
export * from './common';
export * from './database';
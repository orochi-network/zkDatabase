import { EIndexType, ETransactionType } from '@types';
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

export const ESortingSchema = (required: boolean = true) => {
  const joiSorting = Joi.string().valid(EIndexType.Asc, EIndexType.Desc);
  return required ? joiSorting.required() : joiSorting.optional();
};

export const docId = (required: boolean = true) => {
  const joiDocId = Joi.string()
    // docId is UUID type
    // regex for docId (20-36 characters long, including dashes)
    // @TODO: better check for ObjectId, for now MongoDB accepts both hexadecimal and dash-encoded string formats
    .regex(/^[0-9a-fA-F\-]{20,36}$/)
    .min(20)
    .max(36);

  return required ? joiDocId.required() : joiDocId.optional();
};

export const userName = (required: boolean = true) => {
  const joiUserName = Joi.string()
    .trim()
    .min(4)
    .max(128)
    .pattern(/^[a-z]+[._a-z0-9]+/i);
  return required ? joiUserName.required() : joiUserName.optional();
};

export const collectionName = (required: boolean = true) => {
  const joiCollectionName = Joi.string()
    .trim()
    .min(4)
    .max(128)
    .pattern(/^[a-z]+[_a-z0-9]+/i);
  return required ? joiCollectionName.required() : joiCollectionName.optional();
};

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

export const publicKey = (required: boolean = true) => {
  const joiPublicKey = Joi.string()
    .trim()
    .length(55)
    .pattern(/^[A-HJ-NP-Za-km-z1-9]{55}$/);
  return required ? joiPublicKey.required() : joiPublicKey.optional();
};

export const merkleIndex = (required: boolean = true) => {
  const joiMerkleIndex = Joi.custom((value) => {
    return BigInt(value);
  });
  return required ? joiMerkleIndex.required() : joiMerkleIndex.optional();
};

export const index = Joi.array().items(Joi.string().required());

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

export const PERMISSION_DEFAULT = Permission.policyStrict();

export const pagination = Joi.object({
  offset: Joi.number().integer().min(0).default(0).optional(),
  limit: Joi.number().integer().min(1).max(100).default(10).optional(),
});

export const proofTimestamp = Joi.number().custom((value, helper) => {
  // 5 minutes is the timeout for signing up proof
  const timeDiff = Math.floor(Date.now() / 1000) - value;
  if (timeDiff >= 0 && timeDiff < 300) {
    return value;
  }
  return helper.error(
    'Proof timestamp is not within the 5-minute timeout period'
  );
});

export const sortingOrder = Joi.string().valid(...Object.values(EIndexType));

export const indexName = Joi.string()
  .trim()
  .min(2)
  .max(128)
  .required()
  .pattern(/^[_a-z]+[_a-z0-9]+/i);

export const JOI_ZKDB_FIELD_NAME = Joi.string()
  .regex(/^[a-zA-Z][a-zA-Z0-9\_]{1,128}$/)
  .trim()
  .required();

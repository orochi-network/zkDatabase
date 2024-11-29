import { Permission } from '@zkdb/permission';

// System user
export const ZKDATABASE_USER_NOBODY = 'nobody';
export const ZKDATABASE_USER_SYSTEM = 'system';
export const ZKDATABASE_GROUP_NOBODY = 'nobody';
export const ZKDATABASE_GROUP_SYSTEM = 'system';

export const DEFAULT_GROUP_ADMIN = 'admin';

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

export const PERMISSION_DEFAULT_VALUE = Permission.policyStrict().value;

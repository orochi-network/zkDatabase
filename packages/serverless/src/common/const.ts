// Schema metadata
export const ZKDATABASE_SCHEMA_COLLECTION = '_zkdatabase_management';

// Group
export const ZKDATABASE_GROUP_COLLECTION = '_zkdatabase_group';

// User -> Group mapping
export const ZKDATABASE_USER_GROUP_COLLECTION = '_zkdatabase_user_group';

// Permission
export const ZKDATABASE_METADATA_COLLECTION = '_zkdatabase_permission';

// System management
export const ZKDATABASE_GLOBAL_DB = '_zkdatabase_metadata';

// Database settings
export const ZKDATABASE_DB_SETTING_COLLECTION = '_zkdatabase_db_setting';

// Merkle tree metadata collection
export const ZKDATABASE_MERKLE_TREE_METADATA_COLLECTION =
  '_zkdatabase_merkle_tree_metadata';

// Merkle tree pool collection
export const ZKDATABASE_MERKLE_TREE_POOL_COLLECTION =
  '_zkdatabase_merkle_tree_pool';

// Merkle tree collection
export const ZKDATABASE_MERKLE_TREE_COLLECTION = '_zkdatabase_merkle_tree';

// Metadata collections
export const ZKDATABASE_METADATA = [
  ZKDATABASE_SCHEMA_COLLECTION,
  ZKDATABASE_GROUP_COLLECTION,
  ZKDATABASE_USER_GROUP_COLLECTION,
  ZKDATABASE_METADATA_COLLECTION,
  ZKDATABASE_MERKLE_TREE_COLLECTION,
  ZKDATABASE_MERKLE_TREE_METADATA_COLLECTION,
  ZKDATABASE_MERKLE_TREE_POOL_COLLECTION,
];

// System user
export const ZKDATABASE_USER_NOBODY = 'nobody';
export const ZKDATABASE_USER_SYSTEM = 'system';
export const ZKDATABASE_GROUP_NOBODY = 'nobody';
export const ZKDATABASE_GROUP_SYSTEM = 'system';

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

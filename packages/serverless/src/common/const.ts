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

// Metadata collections
export const ZKDATABASE_METADATA = [
  ZKDATABASE_SCHEMA_COLLECTION,
  ZKDATABASE_GROUP_COLLECTION,
  ZKDATABASE_USER_GROUP_COLLECTION,
  ZKDATABASE_METADATA_COLLECTION,
];

// System user
export const ZKDATABAES_USER_NOBODY = 'nobody';
export const ZKDATABAES_USER_SYSTEM = 'system';
export const ZKDATABAES_GROUP_NOBODY = 'nobody';
export const ZKDATABAES_GROUP_SYSTEM = 'system';

// Common constants for zkDatabase collections
export const zkDatabaseCollections = {
  // Schema metadata
  schema: '_zkdatabase_management',

  // Group
  group: '_zkdatabase_group',

  // User -> Group mapping
  userGroup: '_zkdatabase_user_group',

  // Permission
  permission: '_zkdatabase_permission',

  // System management
  globalMetadata: '_zkdatabase_metadata',

  // Database settings
  dbSetting: '_zkdatabase_db_setting',

  // Merkle tree collection
  merkleTree: '_zkdatabase_merkle_tree',

  // Proof queue
  proofQueue: '_zkdatabase_proof_queue',

  // Proof storage
  proofStorage: '_zkdatabase_proof_storage',
};

// Metadata collections
export const zkDatabaseMetadataCollections = [
  zkDatabaseCollections.schema,
  zkDatabaseCollections.group,
  zkDatabaseCollections.userGroup,
  zkDatabaseCollections.permission,
  zkDatabaseCollections.merkleTree,
  zkDatabaseCollections.proofQueue,
  zkDatabaseCollections.proofStorage,
];

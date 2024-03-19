// Common constants for zkDatabase
export const zkDatabaseConstants = {
  // Global database for system management
  globalDatabase: '_zkdatabase_metadata',

  // Collections within the global database
  collections: {
    // Schema metadata
    schema: '_zkdatabase_management',

    // Group
    group: '_zkdatabase_group',

    // User -> Group mapping
    userGroup: '_zkdatabase_user_group',

    // Permission
    permission: '_zkdatabase_permission',

    // Database settings
    dbSetting: '_zkdatabase_db_setting',

    // Merkle tree collection
    merkleTree: '_zkdatabase_merkle_tree',

    // Proof queue
    proofQueue: '_zkdatabase_proof_queue',

    // Proof storage
    proofStorage: '_zkdatabase_proof_storage',
  },
};

// Metadata collections
export const zkDatabaseMetadataCollections = [
  zkDatabaseConstants.collections.schema,
  zkDatabaseConstants.collections.group,
  zkDatabaseConstants.collections.userGroup,
  zkDatabaseConstants.collections.permission,
  zkDatabaseConstants.collections.merkleTree,
  zkDatabaseConstants.collections.proofQueue,
  zkDatabaseConstants.collections.proofStorage,
];

// Common constants for zkDatabase
export const zkDatabaseConstants = {
  // Global database for system management
  globalDatabase: '_zkdatabase_metadata',

  // Global collections within the global database
  globalCollections: {
    // Global settings
    setting: 'setting',

    // Session
    session: 'session',

    // User
    user: 'user',

    // Proof queue
    queue: 'queue',

    // Proof storage
    proof: 'proof',

    // Mina network
    network: 'network',
  },

  // Collections that are common across different databases
  databaseCollections: {
    // Schema metadata
    schema: '_zkdatabase_management',

    // Group
    group: '_zkdatabase_group',

    // User -> Group mapping
    userGroup: '_zkdatabase_user_group',

    // Permission
    permission: '_zkdatabase_permission',

    // Database settings
    setting: '_zkdatabase_db_setting',

    // Merkle tree collection
    merkleTree: '_zkdatabase_merkle_tree',

    // Sequencer
    sequencer: '_zkdatabase_sequencer',
  },
};

// Metadata collections
export const zkDatabaseMetadataCollections = [
  ...Object.values(zkDatabaseConstants.globalCollections),
  ...Object.values(zkDatabaseConstants.databaseCollections),
];

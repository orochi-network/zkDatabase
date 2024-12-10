// Common constants for zkDatabase
export const zkDatabaseConstant = {
  // Global database for system management
  globalDatabase: '_zkdatabase_metadata',

  globalProofDatabase: '_zkdatabase_proof_service',

  // Global collections within the global database
  globalCollection: {
    // Global settings
    metadata_database: 'metadata_database',

    // Session
    session: 'session',

    // User
    user: 'user',

    // Proof queue
    queue: 'queue',

    // Proof storage
    proof: 'proof',

    // Deployed transaction
    transaction: 'transaction',

    secure: 'secure_storage',

    rollup: 'rollup',
  },

  // Collections that are common across different databases
  databaseCollection: {
    // Metadata document
    metadataDocument: '_zkdatabase_metadata_document',
    // Metadata collection
    metadataCollection: '_zkdatabase_metadata_collection',

    // Group
    group: '_zkdatabase_group',

    // User -> Group mapping
    userGroup: '_zkdatabase_user_group',

    // Permission
    permission: '_zkdatabase_permission',

    // Merkle tree collection
    merkleTree: '_zkdatabase_merkle_tree',

    // Sequencer
    sequencer: '_zkdatabase_sequencer',
  },
};

// Metadata collections
export const zkDatabaseMetadataCollections = [
  ...Object.values(zkDatabaseConstant.globalCollection),
  ...Object.values(zkDatabaseConstant.databaseCollection),
];

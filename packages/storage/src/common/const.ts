// Common constants for zkDatabase

// Using for define message queue key for compile service and serverless
export const ZKDB_TRANSACTION_QUEUE = 'transaction_queue';

export const zkDatabaseConstant = {
  // Global database for system management
  globalDatabase: '_zkdatabase_metadata',

  globalProofDatabase: '_zkdatabase_proof_service',

  systemIndex: '_zkdatabase_system_index',

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

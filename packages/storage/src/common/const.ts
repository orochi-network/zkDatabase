// Common constants for zkDatabase

// Using for define message queue key for compile service and serverless
export const ZKDB_TRANSACTION_QUEUE = 'transaction_queue';

export const zkDatabaseConstant = {
  // Global database for system management
  globalDatabase: '_zkdatabase_metadata',

  globalProofDatabase: '_zkdatabase_proof_service',

  globalMerkleTreeDatabase: '_zkdatabase_merkle_tree',

  globalTransitionLogDatabase: '_zkdatabase_transition_log',

  systemIndex: '_zkdatabase_system_index',

  // Global collections within the global database
  globalCollection: {
    // Global settings
    metadataDatabase: 'metadata_database',

    // Session
    session: 'session',

    // User
    user: 'user',

    // Proof storage
    rollupOffChain: 'rollup_offchain',

    // Deployed transaction
    transaction: 'transaction',

    secure: 'secure_storage',

    // OnChain Rollup history
    rollupOnChainHistory: 'rollup_onchain_history',

    // Verification key
    verificationKey: 'verification_key',

    // Rollup onchain
    rollupOnChain: 'rollup_onchain',
    // Queue to store documents waiting to be processed, e.g. update the merkle
    // tree and queue proof tasks
    documentQueue: 'document_queue',
    // Rollup off-chain queue
    rollupOffChainQueue: 'rollup_offchain_queue',
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

    // Sequencer
    sequencer: '_zkdatabase_sequencer',
  },
};

// Metadata collections
export const zkDatabaseMetadataCollections = [
  ...Object.values(zkDatabaseConstant.globalCollection),
  ...Object.values(zkDatabaseConstant.databaseCollection),
];

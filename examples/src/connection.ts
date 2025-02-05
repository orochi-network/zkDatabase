import { ZkDatabase } from 'zkdb';

// In reality you better to encrypt your private key and these information
// It will be better if your load it from .env file
export const zkdb = await ZkDatabase.connect({
  userName: 'chiro-user',
  privateKey: 'EKFTciRxyxshZjimay9sktsn7v5PvmC5zPq7q4JnitHUytxUVnFP',
  environment: 'node',
  // This URL is for test environment
  url: 'https://test-serverless.zkdatabase.org/graphql',
});

export default zkdb;

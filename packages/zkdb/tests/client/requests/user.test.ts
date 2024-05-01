import { signIn, signUp } from '../../../src/client/index.js';
import Client from 'mina-signer';

describe('User Request', () => {
  describe('Sign Up', () => {
    test('succeed with created users', async () => {
      const client = new Client({ network: 'testnet' });

      const userInfo = { email: 'user@example.com', userName: 'user' };

      const keypair = {
        privateKey: 'EKFKAwugYRcoXXzj5L5PYoYcnNnMSLbG3zzgcpDXgsUu2Xy3hPwz',
        publicKey: 'B62qphs6sD7vsL1H3wYDKiUpvL3vZNkFYkncMCyRoy7zXFP972h9ASQ',
      };

      const signUpProof = client.signMessage(
        JSON.stringify(userInfo),
        keypair.privateKey
      );

      const response = await signUp(signUpProof, {
        ...userInfo,
          timestamp: Math.floor(Date.now() / 1000),
          userData: {},
      });

      expect(response.success).toBeTruthy();
      expect(response.email).toEqual('user@example.com');
      expect(response.userName).toEqual('user');
      expect(response.publicKey).toEqual(keypair.publicKey)
    });
  });

  describe('Sign In', () => {
    test('succeed with secret returned', async () => {
      const client = new Client({ network: 'testnet' });

      const userInfo = { email: 'user@example.com', userName: 'user' };

      const keypair = {
        privateKey: 'EKFKAwugYRcoXXzj5L5PYoYcnNnMSLbG3zzgcpDXgsUu2Xy3hPwz',
        publicKey: 'B62qphs6sD7vsL1H3wYDKiUpvL3vZNkFYkncMCyRoy7zXFP972h9ASQ',
      };

      const signInProof = client.signMessage(
        JSON.stringify({ userName: userInfo.userName, timestamp: Math.floor(Date.now() / 1000) }),
        keypair.privateKey
      );

      const response = await signIn(signInProof);

      expect(response.success).toBeTruthy();
      expect(response.email).toEqual('user@example.com');
      expect(response.userName).toEqual('user');
      expect(response.sessionId).toBeDefined();
      expect(response.sessionKey).toBeDefined();
    })
  })

  describe('Sign Out', () => {
    test('succeed sign out', async () => {
      const client = new Client({ network: 'testnet' });

      const userInfo = { email: 'user@example.com', userName: 'user' };

      const keypair = {
        privateKey: 'EKFKAwugYRcoXXzj5L5PYoYcnNnMSLbG3zzgcpDXgsUu2Xy3hPwz',
        publicKey: 'B62qphs6sD7vsL1H3wYDKiUpvL3vZNkFYkncMCyRoy7zXFP972h9ASQ',
      };

      const signInProof = client.signMessage(
        JSON.stringify({ userName: userInfo.userName, timestamp: Math.floor(Date.now() / 1000) }),
        keypair.privateKey
      );

      const response = await signIn(signInProof);

      
    })
  })
});

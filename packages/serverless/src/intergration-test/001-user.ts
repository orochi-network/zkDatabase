import { ObjectId } from 'mongodb';
import { config } from '../helper/config';
import { DatabaseEngine } from '../model/abstract/database-engine';
import ModelDocument from '../model/abstract/document';
import { query } from 'express';
import Client from 'mina-signer';
import { gql, request } from 'graphql-request';
import ModelUser from '../model/global/user';
import { randomBytes } from 'crypto';
import ModelDatabase from '../model/abstract/database';
import { ZKDATABASE_GLOBAL_DB } from '../common/const';
import ModelCollection from '../model/abstract/collection';

const quick = async (document: any, variables: any) =>
  request({
    url: 'http://localhost:4000/graphql',
    document,
    variables,
  });

const timestamp = () => Math.floor(Date.now() / 1000);

(async () => {
  const dbEngine = DatabaseEngine.getInstance(config.mongodbUrl);
  const modelDb = new ModelDatabase();
  if (!dbEngine.isConnected()) {
    await dbEngine.connect();
  }

  const client = new Client({ network: 'testnet' });
  const userInfo = { email: 'user@example.com', userName: 'user' };
  const modelUser = new ModelUser();
  await modelUser.deleteOne({ email: userInfo.email });

  const modelCollection = new ModelCollection(ZKDATABASE_GLOBAL_DB, 'user');
  modelCollection.create({ user: 1 }, { unique: true });
  modelCollection.create({ publicKey: 1 }, { unique: true });
  modelCollection.create({ email: 1 }, { unique: true });

  // Generate keys
  // client.genKeys();
  const keypair = {
    privateKey: 'EKFKAwugYRcoXXzj5L5PYoYcnNnMSLbG3zzgcpDXgsUu2Xy3hPwz',
    publicKey: 'B62qphs6sD7vsL1H3wYDKiUpvL3vZNkFYkncMCyRoy7zXFP972h9ASQ',
  };

  // Test sign up
  const signUpProof = client.signMessage(
    JSON.stringify(userInfo),
    keypair.privateKey
  );
  let result = await quick(
    gql`
      mutation UserSignUp($proof: SignatureProof!, $signUp: SignUp!) {
        userSignUp(proof: $proof, signUp: $signUp) {
          email
          error
          publicKey
          success
          userName
        }
      }
    `,
    {
      proof: signUpProof,
      signUp: {
        ...userInfo,
        timestamp: Math.floor(Date.now() / 1000),
        userData: {},
      },
    }
  );

  console.log(result);

  const signInProof = client.signMessage(
    JSON.stringify({ userName: userInfo.userName, timestamp: timestamp() }),
    keypair.privateKey
  );

  console.log('Find user:', await (await modelUser.find({})).toArray());

  result = await quick(
    gql`
      mutation UserSignIn($proof: SignatureProof!) {
        userSignIn(proof: $proof) {
          success
          error
          userName
          sessionKey
          sessionId
          userData
        }
      }
    `,
    { proof: signInProof }
  );

  console.log(result);

  await DatabaseEngine.getInstance().disconnect();
})();

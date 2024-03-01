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
import logger from '../helper/logger';
import { ModelSchema } from '../model/database/schema';
import { Schema } from '../common/schema';
import { CircuitString, Field } from 'o1js';
import ModelSession from '../model/global/session';
import { IJWTAuthenticationPayload, JWTAuthentication } from '../helper/jwt';

const mutationSignUp = gql`
  mutation UserSignUp($proof: SignatureProof!, $signUp: SignUp!) {
    userSignUp(proof: $proof, signUp: $signUp) {
      email
      error
      publicKey
      success
      userName
    }
  }
`;

const mutationSignIn = gql`
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
`;

const quick = async (document: any, variables: any) =>
  request({
    url: 'http://localhost:4000/graphql',
    document,
    variables,
  });

const timestamp = () => Math.floor(Date.now() / 1000);

const before = async () => {
  const dbEngine = DatabaseEngine.getInstance(config.mongodbUrl);
  if (!dbEngine.isConnected()) {
    await dbEngine.connect();
  }

  ModelUser.init();
};

(async () => {
  await before();
  const client = new Client({ network: 'testnet' });
  const modelUser = new ModelUser();

  // Clean up before test
  const userInfo = { email: 'user@example.com', userName: 'user' };
  await modelUser.deleteOne({ email: userInfo.email });
  await new ModelSession().collection.deleteMany({
    userName: userInfo.userName,
  });

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
  let result = await quick(mutationSignUp, {
    proof: signUpProof,
    signUp: {
      ...userInfo,
      timestamp: Math.floor(Date.now() / 1000),
      userData: {},
    },
  });

  logger.debug(result);

  // Test sign in
  const signInProof = client.signMessage(
    JSON.stringify({ userName: userInfo.userName, timestamp: timestamp() }),
    keypair.privateKey
  );

  logger.debug('Find user:', await (await modelUser.find({})).toArray());

  result = await quick(mutationSignIn, { proof: signInProof });

  logger.debug(result);

  const {
    userSignIn: { sessionKey, sessionId },
  } = <any>result;

  const jwt = new JWTAuthentication<IJWTAuthenticationPayload>(sessionKey);
  const accessToken = await jwt.sign({
    sessionId,
    userName: userInfo.userName,
    email: userInfo.email,
  });

  // Test sign out
  logger.debug(
    await request({
      url: 'http://localhost:4000/graphql',
      document: gql`
        mutation Mutation {
          userSignOut
        }
      `,
      requestHeaders: {
        authorization: `Bearer ${accessToken}`,
      },
    })
  );

  await DatabaseEngine.getInstance().disconnect();
})();

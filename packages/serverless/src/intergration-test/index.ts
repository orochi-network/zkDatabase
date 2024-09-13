import { DatabaseEngine } from '@zkdb/storage';
import Client from 'mina-signer';
import { gql, request } from 'graphql-request';
import { config } from '../helper/config.js';
import ModelUser from '../model/global/user.js';
import logger from '../helper/logger.js';
import { JwtAuthorization } from '../helper/jwt.js';

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
  const dbEngine = DatabaseEngine.getInstance(config.MONGODB_URL);
  if (!dbEngine.isConnected()) {
    await dbEngine.connect();
  }

  ModelUser.init();
};

(async () => {
  await before();
  const client = new Client({ network: 'mainnet' });
  const modelUser = new ModelUser();

  // Clean up before test
  const userInfo = { email: 'user@example.com', userName: 'user' };
  await modelUser.deleteOne({ email: userInfo.email });

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
    userSignIn: { sessionId },
  } = <any>result;

  const accessToken = await JwtAuthorization.sign({
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

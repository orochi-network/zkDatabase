import {
  pagination,
  proofTimestamp,
  publicKey,
  TMinaSignature,
  TUser,
  TUserFindRequest,
  TUserFindResponse,
  TUserMeRequest,
  TUserMeResponse,
  TUserSignInRequest,
  TUserSignInResponse,
  TUserSignUpInput,
  TUserSignUpRequest,
  TUserSignUpResponse,
  userName,
} from '@zkdb/common';
import { randomUUID } from 'crypto';
import { User } from '@domain';
import Joi from 'joi';
import Client from 'mina-signer';
import {
  gql,
  config,
  ACCESS_TOKEN_EXPIRE_TIME,
  calculateAccessTokenDigest,
  headerToAccessToken,
  JwtAuthorization,
  RedisInstance,
  sessionDestroy,
} from '@helper';
import { ModelUser } from '@model';
import { NetworkId } from 'o1js';
import { authorizeWrapper, publicWrapper } from '../validation';

export const typeDefsUser = gql`
  #graphql
  type Query
  type Mutation

  input SignUpInput {
    userName: String!
    email: String!
    userData: JSON
    timestamp: Int!
  }

  type SignUpResponse {
    userName: String!
    email: String!
    userData: JSON
    publicKey: String!
    activated: Boolean!
    createdAt: String!
    updatedAt: String!
  }

  type SignInResponse {
    userName: String!
    accessToken: String!
    userData: JSON!
    publicKey: String!
    email: String!
  }

  type User {
    userName: String
    email: String
    publicKey: String
    activated: Boolean!
  }

  type UserFindResponse {
    data: [User]!
    total: Int!
    offset: Int!
  }

  input UserFindQueryInput {
    userName: String
    email: String
    publicKey: String
  }

  extend type Query {
    userMe: SignInResponse

    userFind(
      query: UserFindQueryInput
      pagination: PaginationInput
    ): UserFindResponse
  }

  extend type Mutation {
    userSignIn(proof: ProofInput!): SignInResponse

    userEcdsaChallenge: String!

    userSignOut: Boolean!

    userSignUp(newUser: SignUpInput!, proof: ProofInput!): SignUpResponse
  }
`;

// Joi validation
export const JOI_SIGNATURE_PROOF = Joi.object<TMinaSignature>({
  signature: Joi.object({
    field: Joi.string()
      .pattern(/[0-9]+/)
      .required(),
    scalar: Joi.string()
      .pattern(/[0-9]+/)
      .required(),
  }).required(),
  publicKey,
  data: Joi.string().required(),
});

export const JOI_USER_SIGN_IN = Joi.object<TUserSignInRequest>({
  proof: JOI_SIGNATURE_PROOF.required(),
});

export const JOI_USER_SIGN_UP = Joi.object<TUserSignUpInput>({
  userName,
  email: Joi.string().email().required(),
  timestamp: proofTimestamp,
  userData: Joi.object().optional(),
});

export const JOI_SIGN_UP = Joi.object<TUserSignUpRequest>({
  newUser: JOI_USER_SIGN_UP,
  proof: JOI_SIGNATURE_PROOF.required(),
});

export const JOI_USER_FIND = Joi.object<TUserFindRequest>({
  query: Joi.object<TUser>({
    userName: userName(false),
    email: Joi.string().email(),
    publicKey: publicKey(false),
  }),
  pagination,
});

// Query
const userMe = authorizeWrapper<TUserMeRequest, TUserMeResponse>(
  async (_root, _args, context) => {
    const user = await new ModelUser().findOne({
      userName: context.userName,
    });
    if (user) {
      return {
        accessToken: context.req.headers.cookie,
        email: user.email,
        publicKey: user.publicKey,
        userData: user.userData,
        userName: user.userName,
      };
    }
    throw new Error('User not found');
  }
);

const userFind = publicWrapper<TUserFindRequest, TUserFindResponse>(
  JOI_USER_FIND,
  async (_root, { query, pagination }) =>
    User.findMany({ query, paginationInput: pagination })
);

const userEcdsaChallenge = publicWrapper(async (_root, _args, context) => {
  const { req } = context;
  // Create new session and store ECDSA challenge
  req.session.ecdsaChallenge = `Please sign this message with your wallet to signin zkDatabase: ${randomUUID()}`;

  req.session.save();

  return req.session.ecdsaChallenge;
});

const userSignIn = publicWrapper<TUserSignInRequest, TUserSignInResponse>(
  JOI_USER_SIGN_IN,
  async (_root, args, context) => {
    if (typeof context.req.session.ecdsaChallenge !== 'string') {
      throw new Error('Invalid ECDSA challenge');
    }

    const client = new Client({
      // Since NETWORK_ID enum return {Testnet, Mainnet} so we need to lowercase and cast
      network: config.NETWORK_ID.toLowerCase() as NetworkId,
    });

    if (args.proof.data !== context.req.session.ecdsaChallenge) {
      throw new Error('Invalid challenge message');
    }

    if (client.verifyMessage(args.proof)) {
      const imUser = new ModelUser();
      const user = await imUser.findOne({
        publicKey: args.proof.publicKey,
      });

      if (user) {
        const { userName, email, publicKey, userData, activated } = user;
        const accessToken = await JwtAuthorization.sign({ userName, email });
        const accessTokenDigest = calculateAccessTokenDigest(accessToken);
        await RedisInstance.accessTokenDigest(accessTokenDigest).set(
          JSON.stringify({ userName, email }),
          { EX: ACCESS_TOKEN_EXPIRE_TIME }
        );
        return {
          userData,
          publicKey,
          email,
          userName,
          accessToken,
          activated,
        };
      }
      throw new Error('User not found');
    }
    throw new Error('Signature is not valid');
  }
);

const userSignOut = authorizeWrapper<unknown, boolean>(
  async (_root, _args, context) => {
    const { req } = context;
    if (req.headers.authorization) {
      const accessTokenDigest = calculateAccessTokenDigest(
        headerToAccessToken(req.headers.authorization)
      );
      await RedisInstance.accessTokenDigest(accessTokenDigest).delete();
    }
    await sessionDestroy(req);
    return true;
  }
);

const userSignUp = publicWrapper<TUserSignUpRequest, TUserSignUpResponse>(
  JOI_SIGN_UP,
  async (_root, args) => {
    const {
      newUser: { userData, userName, email },
      proof,
    } = args;

    return User.signUp({
      user: {
        userName,
        email,
        userData,
        activated: true,
      },
      signature: proof,
    });
  }
);

export const resolversUser = {
  Query: {
    userMe,
    userFind,
  },
  Mutation: {
    userEcdsaChallenge,
    userSignIn,
    userSignOut,
    userSignUp,
  },
};

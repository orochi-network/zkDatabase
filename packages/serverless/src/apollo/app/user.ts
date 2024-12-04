import {
  TMinaSignature,
  TPublicContext,
  TUser,
  TUserFindRequest,
  TUserSignInRequest,
  TUserSignUpInfo,
  TUserSignUpRequest,
} from '@zkdb/common';
import { withTransaction } from '@zkdb/storage';
import { randomUUID } from 'crypto';
import GraphQLJSON from 'graphql-type-json';
import Joi from 'joi';
import Client from 'mina-signer';
import {
  findUser as findUserDomain,
  signUpUser,
} from '../../domain/use-case/user.js';
import { gql } from '../../helper/common.js';
import config from '../../helper/config.js';
import {
  ACCESS_TOKEN_EXPIRE_TIME,
  calculateAccessTokenDigest,
  headerToAccessToken,
  JwtAuthorization,
} from '../../helper/jwt.js';
import RedisInstance from '../../helper/redis.js';
import { sessionDestroy } from '../../helper/session.js';
import ModelUser from '../../model/global/user.js';
import publicWrapper, { authorizeWrapper } from '../validation.js';
import { pagination } from './common.js';
import { DEFAULT_PAGINATION } from 'common/const.js';

const timestamp = Joi.number()
  .custom((value, helper) => {
    // 5 minutes is the timeout for signing up proof
    const timeDiff = Math.floor(Date.now() / 1000) - value;
    if (timeDiff >= 0 && timeDiff < 300) {
      return value;
    }
    return helper.error('Invalid timestamp of time proof');
  })
  .required();

export const SignatureProof = Joi.object<TMinaSignature>({
  signature: Joi.object({
    field: Joi.string()
      .pattern(/[0-9]+/)
      .required(),
    scalar: Joi.string()
      .pattern(/[0-9]+/)
      .required(),
  }).required(),
  publicKey: Joi.string()
    .min(40)
    .pattern(/^[A-HJ-NP-Za-km-z1-9]*$/)
    .required(),
  data: Joi.string().required(),
});

export const SignInRequest = Joi.object<TUserSignInRequest>({
  proof: SignatureProof.required(),
});

export const SignUpInfo = Joi.object<TUserSignUpInfo>({
  userName: Joi.string().required(),
  email: Joi.string().email().required(),
  timestamp,
  userData: Joi.object(),
});

export const SignUpRequest = Joi.object<TUserSignUpRequest>({
  signUp: SignUpInfo.required(),
  proof: SignatureProof.required(),
});

export const UserFindRequest = Joi.object<TUserFindRequest>({
  query: Joi.object<TUser>({
    userName: Joi.string().min(1).max(256),
    email: Joi.string().email(),
    publicKey: Joi.string().min(1).max(256),
  }),
  pagination,
});

export const typeDefsUser = gql`
  #graphql
  scalar JSON
  type Query
  type Mutation

  input MinaSignatureInput {
    field: String
    scalar: String
  }

  input ProofInput {
    signature: MinaSignatureInput
    publicKey: String
    data: String
  }

  input SignUpInfo {
    userName: String
    email: String
    timestamp: Int
    userData: JSON
  }

  type SignInResponse {
    userName: String
    accessToken: String
    userData: JSON
    publicKey: String
    email: String
  }

  input FindUser {
    userName: String
    email: String
    publicKey: String
  }

  type UserPaginationResponse {
    data: [User]!
    totalSize: Int!
    offset: Int!
  }

  extend type Query {
    userSignInData: SignInResponse

    # TODO: Replace JSON
    findUser(query: JSON, pagination: PaginationInput): UserPaginationResponse!

    searchUser(
      query: FindUser!
      pagination: PaginationInput
    ): UserPaginationResponse!
  }

  extend type Mutation {
    userSignIn(proof: ProofInput!): SignInResponse

    userGetEcdsaChallenge: String!

    userSignOut: Boolean

    userSignUp(signUp: SignUpInfo!, proof: ProofInput!): SignUpData
  }
`;

// Query
const userSignInData = authorizeWrapper(
  Joi.object().unknown(),
  async (_root: unknown, _args: any, context) => {
    const user = await new ModelUser().findOne({
      userName: context.userName,
    });
    if (user) {
      return user;
    }
    throw new Error('User not found');
  }
);

const findUser = publicWrapper(
  UserFindRequest,
  async (_root: unknown, args: TUserFindRequest) => {
    return withTransaction(
      async (session) =>
        await findUserDomain(
          args.query,
          args.pagination || DEFAULT_PAGINATION,
          session
        )
    );
  }
);

// Mutation
const userGetEcdsaChallenge = async (
  _root: unknown,
  _args: any,
  context: TPublicContext
) => {
  const { req } = context;
  // Create new session and store ECDSA challenge
  req.session.ecdsaChallenge = `Please sign this message with your wallet to signin zkDatabase: ${randomUUID()}`;

  req.session.save();

  return req.session.ecdsaChallenge;
};

const userSignIn = publicWrapper(
  SignInRequest,
  async (_root: unknown, args: TUserSignInRequest, context) => {
    if (typeof context.req.session.ecdsaChallenge !== 'string') {
      throw new Error('Invalid ECDSA challenge');
    }

    const client = new Client({ network: config.NETWORK_ID });

    if (args.proof.data !== context.req.session.ecdsaChallenge) {
      throw new Error('Invalid challenge message');
    }

    if (client.verifyMessage(args.proof)) {
      const modelUser = new ModelUser();
      const user = await modelUser.findOne({
        publicKey: args.proof.publicKey,
      });

      if (user) {
        const { userName, email } = user;
        const accessToken = await JwtAuthorization.sign({ userName, email });
        const accessTokenDigest = calculateAccessTokenDigest(accessToken);
        await RedisInstance.accessTokenDigest(accessTokenDigest).set(
          JSON.stringify({ userName, email }),
          { EX: ACCESS_TOKEN_EXPIRE_TIME }
        );
        return {
          ...user,
          accessToken,
        };
      }
      throw new Error('User not found');
    }
    throw new Error('Signature is not valid');
  }
);

// @Todo improve this
const userSignOut = authorizeWrapper(
  Joi.object().unknown(),
  async (_root: unknown, _args: any, context) => {
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

const userSignUp = publicWrapper(
  SignUpRequest,
  async (_root: unknown, args: TUserSignUpRequest) => {
    const {
      signUp: { userData, userName, email },
      proof,
    } = args;
    return signUpUser(
      {
        userName,
        email,
        publicKey: proof.publicKey,
      },
      userData,
      proof
    );
  }
);

type TUserResolver = {
  JSON: typeof GraphQLJSON;
  Query: {
    userSignInData: typeof userSignInData;
    findUser: typeof findUser;
  };
  Mutation: {
    userGetEcdsaChallenge: typeof userGetEcdsaChallenge;
    userSignIn: typeof userSignIn;
    userSignOut: typeof userSignOut;
    userSignUp: typeof userSignOut;
  };
};

export const resolversUser: TUserResolver = {
  JSON: GraphQLJSON,
  Query: {
    userSignInData,
    findUser,
  },
  Mutation: {
    userGetEcdsaChallenge,
    userSignIn,
    userSignOut,
    userSignUp,
  },
};

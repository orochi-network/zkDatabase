import { withTransaction } from '@zkdb/storage';
import { randomUUID } from 'crypto';
import GraphQLJSON from 'graphql-type-json';
import Joi from 'joi';
import Client from 'mina-signer';
import { TPublicContext } from '../../common/types.js';
import {
  findUser as findUserDomain,
  signUpUser,
} from '../../domain/use-case/user.js';
import { gql } from '../../helper/common.js';
import {
  ACESS_TOKEN_EXPIRE_TIME,
  calculateAccessTokenDigest,
  headerToAccessToken,
  JwtAuthorization,
} from '../../helper/jwt.js';
import RedisInstance from '../../helper/redis.js';
import { sessionDestroy } from '../../helper/session.js';
import ModelUser from '../../model/global/user.js';
import mapPagination from '../mapper/pagination.js';
import { Pagination } from '../types/pagination.js';
import publicWrapper, { authorizeWrapper } from '../validation.js';
import { pagination } from './common.js';

// We extend express session to define session expiration time
declare module 'express-session' {
  interface SessionData {
    ecdsaChallenge?: string;
  }
}

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

export type TSignatureProof = {
  signature: {
    field: string;
    scalar: string;
  };
  publicKey: string;
  data: string;
};

export const SignatureProof = Joi.object<TSignatureProof>({
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

export type TSignInRequest = {
  proof: TSignatureProof;
};

export const SignInRequest = Joi.object<TSignInRequest>({
  proof: SignatureProof.required(),
});

export type TSignUpRequest = {
  userName: string;
  email: string;
  userData: any;
  timestamp: number;
};

export type TUserFindRequest = {
  query: { [key: string]: string };
  pagination: Pagination;
};

export const SignUpRequest = Joi.object<TSignUpRequest>({
  userName: Joi.string().required(),
  email: Joi.string().email().required(),
  timestamp,
  userData: Joi.object(),
});

export type TSignUpWrapper = {
  signUp: TSignUpRequest;
  proof: TSignatureProof;
};

export const SignUpWrapper = Joi.object<TSignUpWrapper>({
  signUp: SignUpRequest.required(),
  proof: SignatureProof.required(),
});

export const USER_FIND_REQUEST = Joi.object<TUserFindRequest>({
  query: Joi.object(),
  pagination,
});

export const typeDefsUser = gql`
  #graphql
  scalar JSON
  type Query
  type Mutation

  input SignatureInput {
    field: String
    scalar: String
  }

  input ProofInput {
    signature: SignatureInput
    publicKey: String
    data: String
  }

  input SignUp {
    userName: String
    email: String
    timestamp: Int
    userData: JSON
  }

  type SignUpData {
    userName: String
    email: String
    publicKey: String
  }

  type SignInResponse {
    userName: String
    accessToken: String
    userData: JSON
    publicKey: String
  }

  type User {
    userName: String!
    email: String!
    publicKey: String!
  }

  extend type Query {
    userSignInData: SignInResponse
    findUser(query: JSON!, pagination: PaginationInput): [User]!
  }

  extend type Mutation {
    userSignIn(proof: ProofInput!): SignInResponse
    userGetEcdsaChallenge: String!
    userSignOut: Boolean
    userSignUp(signUp: SignUp!, proof: ProofInput!): SignUpData
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
  USER_FIND_REQUEST,
  async (_root: unknown, args: TUserFindRequest) => {
    return withTransaction(async (session) =>
      findUserDomain(args.query, mapPagination(args.pagination), session)
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
  async (_root: unknown, args: TSignInRequest, context) => {
    if (typeof context.req.session.ecdsaChallenge !== 'string') {
      throw new Error('Invalid ECDSA challenge');
    }
    const client = new Client({ network: 'mainnet' });
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
          { EX: ACESS_TOKEN_EXPIRE_TIME }
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
  SignUpWrapper,
  async (_root: unknown, args: TSignUpWrapper) => {
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

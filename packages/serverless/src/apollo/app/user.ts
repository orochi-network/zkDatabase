import { withTransaction } from '@zkdb/storage';
import GraphQLJSON from 'graphql-type-json';
import Joi from 'joi';
import Client from 'mina-signer';
import { TPublicContext } from '../../common/types.js';
import {
  findUser as findUserDomain,
  signUpUser,
} from '../../domain/use-case/user.js';
import { gql } from '../../helper/common.js';
import ModelSession from '../../model/global/session.js';
import ModelUser from '../../model/global/user.js';
import mapPagination from '../mapper/pagination.js';
import { Pagination } from '../types/pagination.js';
import publicWrapper, { authorizeWrapper } from '../validation.js';
import { pagination } from './common.js';

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
    success: Boolean
    error: String
    userName: String
    email: String
    publicKey: String
  }

  type SignInResponse {
    success: Boolean
    error: String
    userName: String
    sessionKey: String
    sessionId: String
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
    userSignOut: Boolean
    userSignUp(signUp: SignUp!, proof: ProofInput!): SignUpData
  }
`;

// Query
const userSignInData = async (
  _root: unknown,
  _args: any,
  context: TPublicContext
) => {
  const session = await ModelSession.getInstance().findOne({
    sessionId: context.sessionId,
  });
  if (session) {
    const user = await new ModelUser().findOne({
      userName: session.userName,
    });
    if (user) {
      return {
        success: true,
        userName: user.userName,
        sessionKey: session.sessionKey,
        sessionId: session.sessionId,
        userData: user.userData,
        publicKey: user.publicKey,
      };
    }
    throw new Error('User not found');
  }
  return {
    success: false,
    error: 'Session not found',
  };
};

const findUser = publicWrapper(
  USER_FIND_REQUEST,
  async (_root: unknown, args: TUserFindRequest) => {
    return withTransaction(async (session) =>
      findUserDomain(args.query, mapPagination(args.pagination), session)
    );
  }
);

// Mutation
const userSignIn = publicWrapper(
  SignInRequest,
  async (_root: unknown, args: TSignInRequest) => {
    // We only support testnet for now to prevent the signature from being used on mainnet
    const client = new Client({ network: 'testnet' });
    if (client.verifyMessage(args.proof)) {
      const modelUser = new ModelUser();
      const user = await modelUser.findOne({
        publicKey: args.proof.publicKey,
      });
      const jsonData = JSON.parse(args.proof.data);
      if (user) {
        if (jsonData.email !== user.email) {
          throw new Error('Email does not match');
        }
        if (timestamp.validate(jsonData.timestamp).error) {
          throw new Error('Timestamp is invalid');
        }
        const session = await ModelSession.getInstance().create(user.userName);
        if (session && session.userName === user.userName) {
          return {
            success: true,
            userName: user.userName,
            sessionKey: session.sessionKey,
            sessionId: session.sessionId,
            userData: user.userData,
            publicKey: user.publicKey,
          };
        }
        throw new Error('Cannot create session');
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
    return (await ModelSession.getInstance().delete(context.sessionId))
      .acknowledged;
  }
);

const userSignUp = publicWrapper(
  SignUpWrapper,
  async (_root: unknown, args: TSignUpWrapper) => {
    return signUpUser(
      {
        userName: args.signUp.userName,
        email: args.signUp.email,
        publicKey: args.proof.publicKey,
      },
      args.signUp.userData,
      args.proof
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
    userSignIn,
    userSignOut,
    userSignUp,
  },
};

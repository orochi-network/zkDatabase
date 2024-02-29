import Joi from 'joi';
import GraphQLJSON from 'graphql-type-json';
import Client from 'mina-signer';
import resolverWrapper from '../validation';
import ModelUser from '../../model/global/user';
import { AppContext } from '../../helper/common';
import ModelSession from '../../model/global/session';

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

export const SignUnRequest = Joi.object<TSignUpRequest>({
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
  signUp: SignUnRequest.required(),
  proof: SignatureProof.required(),
});

export const typeDefsUser = `#graphql
scalar JSON
type Query
type Mutation

input Signature {
    field: String
    scalar: String
}

input SignatureProof {
    signature: Signature
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
}

extend type Query {
  userSignInData: SignInResponse
}

extend type Mutation {
  userSignIn(proof: SignatureProof!): SignInResponse
  userSignOut: Boolean
  userSignUp(signUp: SignUp!, proof: SignatureProof!): SignUpData
}
`;

// Query
const userSignInData = async (
  _root: unknown,
  _args: any,
  context: AppContext
) => {
  const session = await new ModelSession().findOne({
    sessionId: context.sessionId,
  });
  if (session) {
    const user = await new ModelUser().findOne({
      userName: session.userName,
    });
    return {
      success: true,
      sessionKey: session.sessionKey,
      sessionId: session.sessionId,
      userName: session.userName,
      userData: user ? user.userData : null,
    };
  }
  return {
    success: false,
    error: 'Session not found',
  };
};

// Mutation
const userSignIn = resolverWrapper(
  SignInRequest,
  async (_root: unknown, args: TSignInRequest) => {
    // We only support testnet for now to prevent the signature from being used on mainnet
    const client = new Client({ network: 'testnet' });
    if (client.verifyMessage(args.proof)) {
      const modelSession = new ModelSession();
      const modelUser = new ModelUser();
      const user = await modelUser.findOne({
        publicKey: args.proof.publicKey,
      });
      const jsonData = JSON.parse(args.proof.data);
      if (user) {
        if (jsonData.userName !== user.userName) {
          throw new Error('Username does not match');
        }
        if (timestamp.validate(jsonData.timestamp).error) {
          throw new Error('Timestamp is invalid');
        }
        const session = await modelSession.create(user.userName);
        if (session && session.userName === user.userName) {
          return {
            success: true,
            userName: user.userName,
            sessionKey: session.sessionKey,
            sessionId: session.sessionId,
            userData: user.userData,
          };
        }
        throw new Error('Cannot create session');
      }
      throw new Error('User not found');
    }
    throw new Error('Signature is not valid');
  }
);

const userSignOut = async (_root: unknown, _args: any, context: AppContext) => {
  if (context.sessionId) {
    await new ModelSession().delete(context.sessionId);
    return true;
  }
  return false;
};

const userSignUp = resolverWrapper(
  SignUpWrapper,
  async (_root: unknown, args: TSignUpWrapper) => {
    const client = new Client({ network: 'testnet' });
    if (client.verifyMessage(args.proof)) {
      const jsonData = JSON.parse(args.proof.data);
      if (jsonData.userName !== args.signUp.userName) {
        throw new Error('Username does not match');
      }
      if (jsonData.email !== args.signUp.email) {
        throw new Error('Email does not match');
      }
      const modelUser = new ModelUser();
      await modelUser.create(
        args.signUp.userName,
        args.signUp.email,
        args.proof.publicKey,
        args.signUp.userData
      );
      return {
        success: true,
        error: null,
        userName: args.signUp.userName,
        email: args.signUp.email,
        publicKey: args.proof.publicKey,
      };
    }
    throw new Error('Signature is not valid');
  }
);

export const resolversUser = {
  JSON: GraphQLJSON,
  Query: {
    userSignInData,
  },
  Mutation: {
    userSignIn,
    userSignOut,
    userSignUp,
  },
};

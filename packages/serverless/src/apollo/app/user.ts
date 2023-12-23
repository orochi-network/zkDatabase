import Joi from 'joi';
import GraphQLJSON from 'graphql-type-json';
import { ModelCollection } from '../../model/collection';
import { databaseName, collectionName, indexField } from './common';
import { TDatabaseRequest } from './database';
import resolverWrapper from '../validation';
import { ModelDatabase } from '../../model/database';
import logger from '../../helper/logger';

export type TLoginRequest = {
  signature: {
    field: string;
    scalar: string;
  };
  publicKey: string; // 'B62qjU4oFJxvxELv33aecKDU2DBkGCyJ7t5NjWc2BWicLZcG2tgyQEZ';
  data: string;
};

export type TCollectionRequest = TDatabaseRequest & {
  collectionName: string;
};

export type TCollectionCreateRequest = TCollectionRequest & {
  indexField?: string[];
};

export const CollectionRequest = Joi.object<TCollectionRequest>({
  collectionName,
  databaseName,
});

export const CollectionCreateRequest = Joi.object<TCollectionCreateRequest>({
  collectionName,
  databaseName,
  indexField,
});

export const typeDefsLogin = `#graphql
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
  username: String
  email: String
}

type signUpData {
    success: Boolean
    error: String
    username: String
    email: String
    publicKey: String
}

type signInData {
    success: Boolean
    error: String
    sessionToken: String
}

extend type Query {
  signInData: JSON
}

extend type Mutation {
  signIn(proof: SignatureProof!): LoginResponse
  signOut: Boolean
  signUp(signUp: SignUp!, proof: SignatureProof!): Boolean
}
`;

// Query
const signInData = resolverWrapper(
  Joi.object({
    databaseName,
  }),
  async (_root: unknown, args: TDatabaseRequest) =>
    ModelDatabase.getInstance(args.databaseName).listCollections()
);

// Mutation
const signIn = resolverWrapper(
  CollectionCreateRequest,
  async (_root: unknown, args: TCollectionCreateRequest) => {
    try {
      await ModelCollection.getInstance(
        args.databaseName,
        args.collectionName
      ).create(args.indexField || []);
      return true;
    } catch (e) {
      logger.error(e);
      return false;
    }
  }
);

const signOut = resolverWrapper(
  CollectionCreateRequest,
  async (_root: unknown, args: TCollectionCreateRequest) => {
    try {
      await ModelCollection.getInstance(
        args.databaseName,
        args.collectionName
      ).create(args.indexField || []);
      return true;
    } catch (e) {
      logger.error(e);
      return false;
    }
  }
);

const signUp = resolverWrapper(
  CollectionCreateRequest,
  async (_root: unknown, args: TCollectionCreateRequest) => {
    try {
      await ModelCollection.getInstance(
        args.databaseName,
        args.collectionName
      ).create(args.indexField || []);
      return true;
    } catch (e) {
      logger.error(e);
      return false;
    }
  }
);

export const resolversLogin = {
  JSON: GraphQLJSON,
  Query: {
    signInData,
  },
  Mutation: {
    signIn,
    signOut,
    signUp,
  },
};

import Joi from 'joi';
import GraphQLJSON from 'graphql-type-json';
import { ModelProof, ModelQueueTask } from '@zkdb/storage';
import resolverWrapper from '../validation.js';
import { collectionName, databaseName, objectId } from './common.js';
import { AppContext } from '../../common/types.js';
import { TDatabaseRequest } from './database.js';

/* eslint-disable import/prefer-default-export */
export const typeDefsProof = `#graphql
scalar JSON
type Query

type Proof {
  publicInput: [String!]!
  publicOutput: [String!]!
  maxProofsVerified: Int!
  proof: String!
}

extend type Query {
  proofStatus(database: String!, collection: String!, docId: String): String!
  getProof(databaseName: String!): Proof
}
`;

export type TProofRequest = TDatabaseRequest & {
  docId: string;
};

const proofStatus = resolverWrapper(
  Joi.object({
    databaseName,
    collectionName,
    docId: objectId.optional(),
  }),
  async (_root: unknown, args: TProofRequest, ctx: AppContext) => {
    const modelProof = ModelQueueTask.getInstance();

    // TODO: Check permissions
    const proof = await modelProof.findOne({
      database: args.databaseName,
      docId: args.docId,
    });

    if (proof) {
      return proof.status;
    }

    throw Error('Proof has not been found');
  }
);

const getProof = resolverWrapper(
  Joi.object({
    databaseName,
  }),
  async (_root: unknown, args: TProofRequest, ctx: AppContext) => {
    const modelProof = ModelProof.getInstance();

    return modelProof.getProof(args.databaseName);
  }
);

type TProofResolver = {
  JSON: typeof GraphQLJSON;
  Query: {
    proofStatus: typeof proofStatus;
    getProof: typeof getProof;
  };
};

export const resolversProof: TProofResolver = {
  JSON: GraphQLJSON,
  Query: {
    proofStatus,
    getProof,
  },
};

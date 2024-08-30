import Joi from 'joi';
import GraphQLJSON from 'graphql-type-json';
import { ModelProof, ModelQueueTask, withTransaction } from '@zkdb/storage';
import resolverWrapper from '../validation.js';
import { collectionName, databaseName, objectId } from './common.js';
import { AppContext } from '../../common/types.js';
import { hasDocumentPermission } from '../../domain/use-case/permission.js';
import { TCollectionRequest } from './collection.js';

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

enum ProofStatus {
  QUEUED
  PROVING
  PROVED
  FAILED
}

extend type Query {
  getProofStatus(databaseName: String!, collectionName: String!, docId: String): ProofStatus!
  getProof(databaseName: String!): Proof
}
`;

export type TProofRequest = TCollectionRequest & {
  docId: string;
};

const getProofStatus = resolverWrapper(
  Joi.object({
    databaseName,
    collectionName,
    docId: objectId.optional(),
  }),
  async (_root: unknown, args: TProofRequest, ctx: AppContext) => {
    return withTransaction(async (session) => {
      const modelProof = ModelQueueTask.getInstance();

      if (
        await hasDocumentPermission(
          args.databaseName,
          args.collectionName,
          ctx.userName,
          args.docId,
          'read',
          session
        )
      ) {
        const proof = await modelProof.findOne({
          database: args.databaseName,
          docId: args.docId,
        });

        if (proof) {
          switch (proof.status) {
            case 'queued':
              return 'QUEUED';
            case 'proving':
              return 'PROVING';
            case 'proved':
              return 'PROVED';
            case 'failed':
              return 'FAILED';
            default:
              throw new Error(`Unknown proof status: ${proof.status}`);
          }
        }
        throw Error('Proof has not been found');
      }

      throw new Error(
        `Access denied: Actor '${ctx.userName}' does not have 'read' permission for the specified document.`
      );
    });
  }
);

const getProof = resolverWrapper(
  Joi.object({
    databaseName,
  }),
  async (_root: unknown, args: TProofRequest) => {
    const modelProof = ModelProof.getInstance();

    return modelProof.getProof(args.databaseName);
  }
);

type TProofResolver = {
  JSON: typeof GraphQLJSON;
  Query: {
    getProofStatus: typeof getProofStatus;
    getProof: typeof getProof;
  };
};

export const resolversProof: TProofResolver = {
  JSON: GraphQLJSON,
  Query: {
    getProofStatus,
    getProof,
  },
};

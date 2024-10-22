import Joi from 'joi';
import GraphQLJSON from 'graphql-type-json';
import { ModelProof, ModelQueueTask, withTransaction } from '@zkdb/storage';
import publicWrapper, { authorizeWrapper } from '../validation.js';
import { collectionName, databaseName, networkId, objectId } from './common.js';
import { hasDocumentPermission } from '../../domain/use-case/permission.js';
import { TCollectionRequest } from './collection.js';
import { EDatabaseProofStatus } from '../../domain/types/proof-status.js';

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

enum DatabaseProofStatus {
  EMPTY
  PENDING
  PROVED
}

extend type Query {
  getProofStatus(networkId: NetworkId!, databaseName: String!, collectionName: String!, docId: String): ProofStatus!
  getDatabaseProofStatus(networkId: NetworkId!, databaseName: String!): DatabaseProofStatus!
  getProof(networkId: NetworkId!, databaseName: String!): Proof
}
`;

export type TProofRequest = TCollectionRequest & {
  docId: string;
};

const getProofStatus = authorizeWrapper(
  Joi.object({
    databaseName,
    collectionName,
    docId: objectId.optional(),
    networkId
  }),
  async (_root: unknown, args: TProofRequest, ctx) => {
    return withTransaction(async (session) => {
      const modelProof = ModelQueueTask.getInstance();

      if (
        await hasDocumentPermission(
          args.networkId,
          args.databaseName,
          args.collectionName,
          ctx.userName,
          args.docId,
          'read',
          session
        )
      ) {
        const proof = await modelProof.findOne({
          databaseName: args.databaseName,
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

const getProof = publicWrapper(
  Joi.object({
    databaseName,
    networkId
  }),
  async (_root: unknown, args: TProofRequest) => {
    const modelProof = ModelProof.getInstance();

    return modelProof.getProof(args.networkId, args.databaseName);
  }
);

const getDatabaseProofStatus = publicWrapper(
  Joi.object({
    databaseName,
    networkId
  }),
  async (_root: unknown, args: TProofRequest) => {
    const modelTask = ModelQueueTask.getInstance();

    const task = await modelTask.findOne({
      databaseName: args.databaseName,
      status: { $in: ['proving', 'queued'] },
    });

    if (task) {
      return EDatabaseProofStatus.Pending;
    } else {
      const modelProof = ModelProof.getInstance();
      const proof = await modelProof.getProof(args.networkId, args.databaseName);

      return proof ? EDatabaseProofStatus.Proved : EDatabaseProofStatus.Empty;
    }
  }
);

type TProofResolver = {
  JSON: typeof GraphQLJSON;
  Query: {
    getProofStatus: typeof getProofStatus;
    getProof: typeof getProof;
    getDatabaseProofStatus: typeof getDatabaseProofStatus;
  };
};

export const resolversProof: TProofResolver = {
  JSON: GraphQLJSON,
  Query: {
    getProofStatus,
    getProof,
    getDatabaseProofStatus,
  },
};

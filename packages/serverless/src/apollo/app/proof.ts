import {
  collectionName,
  databaseName,
  EDatabaseProofStatus,
  EDocumentProofStatus,
  objectId,
  TDocumentProofRequest,
} from '@zkdb/common';
import { ModelProof, ModelQueueTask, withTransaction } from '@zkdb/storage';
import GraphQLJSON from 'graphql-type-json';
import Joi from 'joi';
import { PermissionSecurity } from '../../domain/use-case/permission-security.js';
import { authorizeWrapper, publicWrapper } from '../validation.js';

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
  getProofStatus(databaseName: String!, collectionName: String!, docId: String): ProofStatus!
  getDatabaseProofStatus(databaseName: String!): DatabaseProofStatus!
  getProof(databaseName: String!): Proof
}
`;

const getProofStatus = authorizeWrapper<
  TDocumentProofRequest,
  EDocumentProofStatus
>(
  Joi.object({
    databaseName,
    collectionName,
    docId: objectId.optional(),
  }),
  async (_root, { databaseName, collectionName, docId }, ctx) => {
    const imProof = ModelQueueTask.getInstance();
    if (
      (
        await PermissionSecurity.document({
          databaseName,
          collectionName,
          docId,
          actor: ctx.userName,
        })
      ).read
    ) {
      const proof = await imProof.findOne({
        databaseName,
        docId,
      });

      if (!proof) {
        throw new Error('Proof has not been found');
      }

      return proof.status as EDocumentProofStatus;
    }

    throw new Error(
      `Access denied: Actor '${ctx.userName}' does not have 'read' permission for the specified document.`
    );
  }
);

const getProof = publicWrapper(
  Joi.object({
    databaseName,
  }),
  async (_root: unknown, args: TDocumentProofRequest) => {
    const modelProof = ModelProof.getInstance();

    return modelProof.getProof(args.databaseName);
  }
);

const getDatabaseProofStatus = publicWrapper(
  Joi.object({
    databaseName,
  }),
  async (_root: unknown, args: TDocumentProofRequest) => {
    const modelTask = ModelQueueTask.getInstance();

    const task = await modelTask.findOne({
      database: args.databaseName,
      status: {
        $in: [EDocumentProofStatus.Proving, EDocumentProofStatus.Queued],
      },
    });

    if (task) {
      return EDatabaseProofStatus.Proving;
    } else {
      const modelProof = ModelProof.getInstance();
      const proof = await modelProof.getProof(args.databaseName);

      return proof ? EDatabaseProofStatus.Proved : EDatabaseProofStatus.None;
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

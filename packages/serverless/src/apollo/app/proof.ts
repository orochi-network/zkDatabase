import {
  collectionName,
  databaseName,
  EDatabaseProofStatus,
  EDocumentProofStatus,
  objectId,
  TDocumentProofRequest,
} from '@zkdb/common';
import { ModelProof, ModelQueueTask } from '@zkdb/storage';
import GraphQLJSON from 'graphql-type-json';
import Joi from 'joi';
import { PermissionSecurity } from '@domain';
import { authorizeWrapper, publicWrapper } from '../validation';
import { gql } from '@helper';

/* eslint-disable import/prefer-default-export */
export const typeDefsProof = gql`
  #graphql
  scalar JSON
  type Query

  # TZKDatabaseProof in TS
  type ZkProof {
    publicInput: [String!]!
    publicOutput: [String!]!
    maxProofsVerified: Int!
    proof: String!
  }

  enum ProofStatus {
    Queued
    Proving
    Proved
    Failed
  }

  enum DatabaseProofStatus {
    None
    Proving
    Proved
    Failed
  }

  extend type Query {
    zkProofStatusDocument(
      databaseName: String!
      collectionName: String!
      docId: String
    ): ProofStatus!
    zkProofStatusDatabase(databaseName: String!): DatabaseProofStatus!
    zkProof(databaseName: String!): ZkProof
  }
`;

const zkProofStatusDocument = authorizeWrapper<
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

const zkProof = publicWrapper(
  Joi.object({
    databaseName,
  }),
  async (_root: unknown, args: TDocumentProofRequest) => {
    const modelProof = ModelProof.getInstance();

    return modelProof.getProof(args.databaseName);
  }
);

const zkProofStatusDatabase = publicWrapper(
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

export const resolversProof = {
  JSON: GraphQLJSON,
  Query: {
    zkProof,
    zkProofStatusDatabase,
    zkProofStatusDocument,
  },
};

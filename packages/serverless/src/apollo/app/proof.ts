import { PermissionSecurity } from '@domain';
import { gql } from '@helper';
import {
  collectionName,
  databaseName,
  docId,
  EProofDatabaseStatus,
  EProofStatusDocument,
  TProofStatusDatabaseRequest,
  TProofStatusDatabaseResponse,
  TProofStatusDocumentRequest,
  TProofStatusDocumentResponse,
  TZkProofRequest,
  TZkProofResponse,
} from '@zkdb/common';
import { ModelProof, ModelQueueTask } from '@zkdb/storage';
import Joi from 'joi';
import { authorizeWrapper, publicWrapper } from '../validation';

/* eslint-disable import/prefer-default-export */
export const typeDefsProof = gql`
  #graphql
  type Query

  # TZkDatabaseProof in TS
  type ZkProof {
    publicInput: [String!]!
    publicOutput: [String!]!
    maxProofsVerified: Int!
    proof: String!
  }

  enum ProofStatusDocument {
    Queued
    Proving
    Proved
    Failed
  }

  enum ProofStatusDatabase {
    None
    Proving
    Proved
    Failed
  }

  extend type Query {
    proofStatusDocument(
      databaseName: String!
      collectionName: String!
      docId: String
    ): ProofStatusDocument!

    proofStatusDatabase(databaseName: String!): ProofStatusDatabase!

    proof(databaseName: String!): ZkProof
  }
`;

const proofStatusDocument = authorizeWrapper<
  TProofStatusDocumentRequest,
  TProofStatusDocumentResponse
>(
  Joi.object({
    databaseName,
    collectionName,
    docId: docId(false),
  }),
  async (_root, { databaseName, collectionName, docId }, ctx) => {
    const actorPermission = await PermissionSecurity.document({
      databaseName,
      collectionName,
      docId,
      actor: ctx.userName,
    });
    if (actorPermission.read) {
      const imProof = ModelQueueTask.getInstance();
      const proof = await imProof.findOne({
        databaseName,
        docId,
      });

      if (!proof) {
        throw new Error('Proof has not been found');
      }

      return proof.status;
    }

    throw new Error(
      `Access denied: Actor '${ctx.userName}' does not have 'read' permission for the specified document.`
    );
  }
);

const proof = publicWrapper<TZkProofRequest, TZkProofResponse>(
  Joi.object({
    databaseName,
  }),
  async (_root, { databaseName }) => {
    const modelProof = ModelProof.getInstance();

    return modelProof.findOne({ databaseName }, { sort: { createdAt: -1 } });
  }
);

const proofStatusDatabase = publicWrapper<
  TProofStatusDatabaseRequest,
  TProofStatusDatabaseResponse
>(
  Joi.object({
    databaseName,
  }),
  async (_root, { databaseName }) => {
    const modelTask = ModelQueueTask.getInstance();

    const task = await modelTask.findOne({
      databaseName,
      status: {
        $in: [EProofStatusDocument.Proving, EProofStatusDocument.Queued],
      },
    });

    if (task) {
      return EProofDatabaseStatus.Proving;
    } else {
      const modelProof = ModelProof.getInstance();
      const proof = await modelProof.findOne(
        { databaseName },
        { sort: { createdAt: -1 } }
      );
      return proof ? EProofDatabaseStatus.Proved : EProofDatabaseStatus.None;
    }
  }
);

export const resolversProof = {
  Query: {
    proof,
    proofStatusDatabase,
    proofStatusDocument,
  },
};

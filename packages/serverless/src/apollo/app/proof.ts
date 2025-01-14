import { PermissionSecurity } from '@domain';
import { getProofStatusDocumentFromQueueTaskStatus, gql } from '@helper';
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
  TRollupQueueData,
  TZkProofRequest,
  TZkProofResponse,
} from '@zkdb/common';
import {
  EQueueTaskStatus,
  ModelGenericQueue,
  ModelRollupOffChain,
  withCompoundTransaction,
  zkDatabaseConstant,
} from '@zkdb/storage';
import Joi from 'joi';
import { ClientSession } from 'mongodb';
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
    return withCompoundTransaction(async (compoundTransaction) => {
      const { serverless, proofService } = compoundTransaction;
      const actorPermission = await PermissionSecurity.document(
        {
          databaseName,
          collectionName,
          docId,
          actor: ctx.userName,
        },
        serverless
      );

      if (actorPermission.read) {
        const imRollupQueue =
          await ModelGenericQueue.getInstance<TRollupQueueData>(
            zkDatabaseConstant.globalCollection.documentQueue,
            proofService
          );
        const proof = await imRollupQueue.findOne(
          {
            databaseName,
            'data.docId': docId,
          },
          { session: proofService }
        );

        if (!proof) {
          throw new Error('Proof has not been found');
        }

        return getProofStatusDocumentFromQueueTaskStatus(proof.status);
      }

      throw new Error(
        `Access denied: Actor '${ctx.userName}' does not have 'read' permission for the specified document.`
      );
    });
  }
);

const proof = publicWrapper<TZkProofRequest, TZkProofResponse>(
  Joi.object({
    databaseName,
  }),
  async (_root, { databaseName }) => {
    const imProof = ModelRollupOffChain.getInstance();
    return imProof.findOne({ databaseName }, { sort: { createdAt: -1 } });
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
    const proofService = {} as ClientSession;

    const imRollupQueue = await ModelGenericQueue.getInstance<TRollupQueueData>(
      zkDatabaseConstant.globalCollection.documentQueue,
      proofService
    );

    const task = await imRollupQueue.findOne({
      databaseName,
      status: {
        $in: [EQueueTaskStatus.Proving, EProofStatusDocument.Queued],
      },
    });

    if (task) {
      return EProofDatabaseStatus.Proving;
    } else {
      const modelProof = ModelRollupOffChain.getInstance();
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

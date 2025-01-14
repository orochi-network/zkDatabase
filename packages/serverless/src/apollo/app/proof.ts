import { PermissionSecurity } from '@domain';
import { gql } from '@helper';
import {
  collectionName,
  databaseName,
  docId,
  TProofStatusDocumentRequest,
  TProofStatusDocumentResponse,
  TRollupQueueData,
  TZkProofRequest,
  TZkProofResponse,
  TZkProofStatusRequest,
  TZkProofStatusResponse,
} from '@zkdb/common';
import {
  ModelGenericQueue,
  ModelRollupOffChain,
  withCompoundTransaction,
  withTransaction,
  zkDatabaseConstant,
} from '@zkdb/storage';
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

  extend type Query {
    proofStatusDocument(
      databaseName: String!
      collectionName: String!
      docId: String
    ): QueueTaskStatus!

    zkProofStatus(databaseName: String!): QueueTaskStatus!

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
            zkDatabaseConstant.globalCollection.rollupOffChainQueue,
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

        return proof.status;
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

const zkProofStatus = publicWrapper<
  TZkProofStatusRequest,
  TZkProofStatusResponse
>(
  Joi.object({
    databaseName,
  }),
  async (_root, { databaseName }) => {
    return withTransaction(async (proofSession) => {
      const imRollupQueue =
        await ModelGenericQueue.getInstance<TRollupQueueData>(
          zkDatabaseConstant.globalCollection.rollupOffChainQueue,
          proofSession
        );
      // Get latest task rollup task queue
      const task = await imRollupQueue.findOne({
        databaseName,
        sort: { createdAt: -1 },
      });

      if (!task) {
        return null;
      }

      return task.status;
    });
  }
);

export const resolversProof = {
  Query: {
    proof,
    zkProofStatus,
    proofStatusDocument,
  },
};

import { withTransaction } from '@zkdb/storage';
import GraphQLJSON from 'graphql-type-json';
import Joi from 'joi';
import { authorizeWrapper } from '../validation.js';
import {
  listHistoryDocuments,
  readHistoryDocument,
} from '../../domain/use-case/document-history.js';
import { collectionName, databaseName, pagination } from './common.js';
import mapPagination from '../mapper/pagination.js';
import { TPagination, TCollectionRequest } from '../../types/index.js';
import { gql } from '../../helper/common.js';

export type TDocumentHistoryGetRequest = TCollectionRequest & {
  docId: string;
};

export type TDocumentHistoryListRequest = TCollectionRequest & {
  pagination: TPagination;
};

export const DOCUMENT_HISTORY_GET_REQUEST =
  Joi.object<TDocumentHistoryGetRequest>({
    databaseName,
    collectionName,
    docId: Joi.string(),
  });

export const DOCUMENT_HISTORY_LIST_REQUEST =
  Joi.object<TDocumentHistoryListRequest>({
    databaseName,
    collectionName,
    pagination,
  });

export const typeDefsDocumentHistory = gql`
  #graphql
  scalar JSON
  type Query

  extend type Query {
    documentsHistoryList(
      databaseName: String!
      collectionName: String!
      docId: String
      pagination: PaginationInput
    ): [DocumentHistoryOutput]!
  }
`;

const historyDocumentGet = authorizeWrapper(
  DOCUMENT_HISTORY_GET_REQUEST,
  async (_root: unknown, args: TDocumentHistoryGetRequest, ctx) => {
    const document = await withTransaction((session) =>
      readHistoryDocument(
        args.databaseName,
        args.collectionName,
        ctx.userName,
        args.docId,
        session
      )
    );

    if (!document) {
      return null;
    }

    const result = {
      docId: document.docId,
      documents: document.documents,
    };

    return result;
  }
);

const documentsHistoryList = authorizeWrapper(
  Joi.object().optional(),
  async (_root: unknown, args: TDocumentHistoryListRequest, ctx) => {
    return withTransaction(async (session) => {
      const documents = await listHistoryDocuments(
        args.databaseName,
        args.collectionName,
        ctx.userName,
        mapPagination(args.pagination),
        session
      );

      return documents;
    });
  }
);

type TDocumentHistoryResolver = {
  JSON: typeof GraphQLJSON;
  Query: {
    historyDocumentGet: typeof historyDocumentGet;
    documentsHistoryList: typeof documentsHistoryList;
  };
};

export const resolversDocumentHistory: TDocumentHistoryResolver = {
  JSON: GraphQLJSON,
  Query: {
    historyDocumentGet,
    documentsHistoryList,
  },
};

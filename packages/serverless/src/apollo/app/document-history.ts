import { TransactionManager } from '@zkdb/storage';
import GraphQLJSON from 'graphql-type-json';
import Joi from 'joi';
import { authorizeWrapper } from '../validation.js';
import {
  listHistoryDocuments,
  readHistoryDocument,
} from '../../domain/use-case/document-history.js';
import { collectionName, databaseName, pagination } from './common.js';
import mapPagination from '../mapper/pagination.js';
import { TCollectionRequest } from './collection.js';
import { Pagination } from '../types/pagination.js';

export type TDocumentHistoryGetRequest = TCollectionRequest & {
  docId: string;
};

export type TDocumentHistoryListRequest = TCollectionRequest & {
  pagination: Pagination;
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

export const typeDefsDocumentHistory = `#graphql
scalar JSON
type Query

extend type Query {
  historyDocumentGet(databaseName: String!, collectionName: String!, docId: String!): DocumentHistoryOutput
  documentsHistoryList(
    databaseName: String!, 
    collectionName: String!,
    pagination: PaginationInput
  ): [DocumentHistoryOutput]!
}
`;

const historyDocumentGet = authorizeWrapper(
  DOCUMENT_HISTORY_GET_REQUEST,
  async (_root: unknown, args: TDocumentHistoryGetRequest, ctx) => {
    const document = await TransactionManager.withSingleTransaction(
      'service',
      (session) =>
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
    return TransactionManager.withSingleTransaction(
      'service',
      async (session) => {
        const documents = await listHistoryDocuments(
          args.databaseName,
          args.collectionName,
          ctx.userName,
          mapPagination(args.pagination),
          session
        );

        return documents;
      }
    );
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

import GraphQLJSON from 'graphql-type-json';
import { withTransaction } from '@zkdb/storage';
import Joi from 'joi';
import resolverWrapper from '../validation.js';
import { Search } from '../types/search.js';
import { Pagination } from '../types/pagination.js';
import { search } from './common.js';
import { AppContext } from '../../common/types.js';
import { searchUsers as searchUserDomain } from '../../domain/use-case/user.js';
import { searchDocuments as searchDocumentsDomain, searchAggregatedDocuments } from '../../domain/use-case/document.js';
import mapSearchToQueryOptions from '../mapper/search.js';
import mapPagination from '../mapper/pagination.js';

export type TSearchRequest = {
  search: Search;
  pagination: Pagination;
};

export type TSearchDocumentRequest = TSearchRequest & {
  databaseName: string;
  collectionName: string;
};

export const typeDefsSearch = `#graphql
scalar JSON
scalar Date
type Query

type User {
  userName: String!,
  email: String!,
  publicKey: String!
}
 
type Metadata {
  merkleIndex: Int!,
  owner: String!
  group: String!
  permissionOwner: PermissionRecord!
  permissionGroup: PermissionRecord!
  permissionOther: PermissionRecord!
}

type DocumentAggregatedOutput {
  document: DocumentOutput!
  metadata: Metadata!,
  proofStatus: String
}

extend type Query {
  searchUser(search: SearchInput, pagination: PaginationInput): [User]!

  searchDocument(
    databaseName: String!, 
    collectionName: String!, 
    search: SearchInput, 
    pagination: PaginationInput
  ): [DocumentOutput]!

  searchAggregatedDocument(
    databaseName: String!, 
    collectionName: String!, 
    search: SearchInput, 
    pagination: PaginationInput
  ): [DocumentAggregatedOutput]!
}
`;

const searchUser = resolverWrapper(
  search,
  async (_root: unknown, args: TSearchRequest, _ctx: AppContext) => {
    return withTransaction(async (session) =>
      searchUserDomain(
        mapSearchToQueryOptions(args.search),
        mapPagination(args.pagination),
        session
      )
    );
  }
);

const searchDocument = resolverWrapper(
  Joi.object().optional(),
  async (_root: unknown, args: TSearchDocumentRequest, _ctx: AppContext) => {
    return withTransaction(async (session) => {
      const documents = await searchDocumentsDomain(
        args.databaseName,
        args.collectionName,
        _ctx.userName,
        mapSearchToQueryOptions(args.search),
        mapPagination(args.pagination),
        session
      );

      return documents;
    });
  }
);

const searchAggregatedDocument = resolverWrapper(
  Joi.object().optional(),
  async (_root: unknown, args: TSearchDocumentRequest, _ctx: AppContext) => {
    return withTransaction(async (session) => {
      const documents = await searchAggregatedDocuments(
        args.databaseName,
        args.collectionName,
        "oleh-dev",
        mapSearchToQueryOptions(args.search),
        mapPagination(args.pagination),
        session
      );

      return documents;
    });
  }
);

type TSearchResolver = {
  JSON: typeof GraphQLJSON;
  Query: {
    searchUser: typeof searchUser;
    searchDocument: typeof searchDocument;
    searchAggregatedDocument: typeof searchAggregatedDocument;
  };
};

export const resolverSearch: TSearchResolver = {
  JSON: GraphQLJSON,
  Query: {
    searchUser,
    searchDocument,
    searchAggregatedDocument
  },
};

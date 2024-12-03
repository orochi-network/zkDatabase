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

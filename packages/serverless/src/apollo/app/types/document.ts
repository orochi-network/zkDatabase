// eslint-disable-next-line import/prefer-default-export
export const typeCommonDefsDocument = `#graphql
scalar JSON
scalar Date

input DocumentRecordInput {
  name: String!
  kind: String!
  value: String!
}

type DocumentRecordOutput {
  name: String!
  kind: String!
  value: String!
}

type DocumentOutput {
  docId: String!,
  fields: [DocumentRecordOutput!]!
  createdAt: Date
}

type DocumentHistoryOutput {
  docId: String!,
  documents: [DocumentOutput!]!
}
`;

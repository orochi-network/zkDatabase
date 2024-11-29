// eslint-disable-next-line import/prefer-default-export
export const typeCommonDefsMetadata = `#graphql
scalar JSON
scalar Date


type DocumentMetadataOutput {
  merkleIndex: Int!,
  userName: String!
  groupName: String!
  permission: Number!
}

type CollectionMetadataOutput {
  userName: String!
  groupName: String!
  permission: Number!
}
`;

// eslint-disable-next-line import/prefer-default-export
export const typeCommonDefsMetadata = `#graphql
scalar JSON
scalar Date


type DocumentMetadataOutput {
  merkleIndex: Int!,
  owner: String!
  group: String!
  permission: Number!
}

type CollectionMetadataOutput {
  owner: String!
  group: String!
  permission: Number!
}
`;

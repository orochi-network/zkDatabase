// eslint-disable-next-line import/prefer-default-export
export const typeCommonDefsCollectionIndex = `#graphql
enum SortingOrder {
  ASC
  DESC
}

input IndexInput {
  name: String!
  sorting: SortingOrder!
}
`;

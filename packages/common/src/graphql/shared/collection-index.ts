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

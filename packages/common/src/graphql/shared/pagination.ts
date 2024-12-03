export const typeCommonDefsPagination = `#graphql
  scalar JSON
  scalar Date

  input PaginationInput {
    limit: Int,
    offset: Int
  }
`;

// eslint-disable-next-line import/prefer-default-export
export const typeCommonDefsPagination = `#graphql
scalar JSON
scalar Date

input PaginationInput {
  limit: Int,
  offset: Int
}
`;
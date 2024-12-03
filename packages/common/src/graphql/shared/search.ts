export const typeCommonDefsSearch = `#graphql
  scalar JSON
  scalar Date

  input ConditionInput {
    field: String!
    value: String!
    operator: String!
  }

  input SearchInput {
    and: [SearchInput]
    or: [SearchInput]
    condition: ConditionInput
  }
`;

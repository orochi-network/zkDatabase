export const typeDefsUser = `#graphql
  scalar JSON
  type Query
  type Mutation

  input SignatureInput {
    field: String
    scalar: String
  }

  input ProofInput {
    signature: SignatureInput
    publicKey: String
    data: String
  }

  input SignUp {
    userName: String
    email: String
    timestamp: Int
    userData: JSON
  }

  type SignUpData {
    userName: String
    email: String
    publicKey: String
  }

  type SignInResponse {
    userName: String
    accessToken: String
    userData: JSON
    publicKey: String
    email: String
  }

  type User {
    userName: String!
    email: String!
    publicKey: String!
  }

  input FindUser {
    userName: String
    email: String
    publicKey: String
  }

  type UserPaginationOutput {
    data: [User]!
    totalSize: Int!
    offset: Int!
  }

  extend type Query {
    userSignInData: SignInResponse
    # TODO: Replace JSON
    findUser(query: JSON, pagination: PaginationInput): UserPaginationOutput!
    searchUser(
      query: FindUser!
      pagination: PaginationInput
    ): UserPaginationOutput!
  }

  extend type Mutation {
    userSignIn(proof: ProofInput!): SignInResponse
    userGetEcdsaChallenge: String!
    userSignOut: Boolean
    userSignUp(signUp: SignUp!, proof: ProofInput!): SignUpData
  }
`;

export const typeDefsEnvironment = `#graphql
  scalar JSON
  type Query

  enum ENetworkId {
    testnet
    mainnet
  }

  type EnvironmentInfo {
    networkId: ENetworkId!
    networkUrl: String!
  }

  extend type Query {
    getEnvironment: EnvironmentInfo!
  }
`;

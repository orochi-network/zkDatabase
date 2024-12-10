import { gql } from "@apollo/client";
import { TEnvironment } from "@zkdb/common";
import { createQueryFunction, TApolloClient } from "./common.js";

const ENVIRONMENT_GET = gql`
  query GetEnvironment {
    getEnvironment {
      networkId
      networkUrl
    }
  }
`;

export const environment = <T>(client: TApolloClient<T>) => ({
  getEnvironment: createQueryFunction<
    TEnvironment,
    undefined,
    { getEnvironment: TEnvironment }
  >(client, ENVIRONMENT_GET, (data) => data.getEnvironment),
});

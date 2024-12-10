import { ApolloClient, InMemoryCache } from "@apollo/client";
import { TEnvironment } from "@zkdb/common";
import { environment } from "../graphql/environment";

export const getNetworkEnvironment = async (
  uri: string
): Promise<TEnvironment> => {
  const api = new ApolloClient({ uri, cache: new InMemoryCache() });
  const result = await environment(api).getEnvironment(undefined);
  return result.unwrap();
};

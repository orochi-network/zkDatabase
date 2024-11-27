import { ApolloClient, InMemoryCache } from "@apollo/client";
import { environment } from "../graphql/environment";
import { TEnvironment } from "../graphql/types/environment";

export const getNetworkEnvironment = async (
  uri: string
): Promise<TEnvironment> => {
  const api = new ApolloClient({ uri, cache: new InMemoryCache() });
  const result = await environment(api).getEnvironment(undefined);
  return result.unwrap();
};

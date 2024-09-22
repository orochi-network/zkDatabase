import pkg from "@apollo/client";
const { ApolloClient, InMemoryCache, HttpLink, ApolloLink } = pkg;
import { setContext } from "@apollo/client/link/context/index.js";
import { removeTypenameFromVariables } from "@apollo/client/link/remove-typename/index.js";
import { getJwtToken } from "../bridge/token-data.js";
import customFetch from "./graphql-fetch.js";

const httpLink = new HttpLink({
  uri: 'http://localhost:4000/graphql',
  fetch: customFetch,
  credentials: "include"
});

const authLink = setContext((_, { headers }) => {
  const token = getJwtToken();
  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : "",
    },
  };
});

const removeTypenameLink = removeTypenameFromVariables();

const link = ApolloLink.from([removeTypenameLink, authLink, httpLink]);

const client = new ApolloClient({
  link: link,
  cache: new InMemoryCache({ addTypename: false }),
});

export default client;

import pkg from '@apollo/client';
const { ApolloClient, InMemoryCache, HttpLink, ApolloLink } = pkg;
import { setContext } from '@apollo/client/link/context/index.js';
import { getToken } from '../authentication/jwt-token.js';
import { config } from '../helper/config.js';

const httpLink = new HttpLink({
  uri: config.AAS_URI,
});

const authLink = setContext(async (_, { headers }) => {
  const token = await getToken();
  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : '',
    },
  };
});

const link = ApolloLink.from([authLink, httpLink]);

const client = new ApolloClient({
  link: link,
  cache: new InMemoryCache(),
});

export default client;

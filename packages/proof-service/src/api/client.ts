import pkg from '@apollo/client';
const { ApolloClient, InMemoryCache, HttpLink } = pkg;
import fetch from 'cross-fetch';

const httpLink = new HttpLink({
  uri: 'http://localhost:4000/graphql',
  fetch,
});

const client = new ApolloClient({
  link: httpLink,
  cache: new InMemoryCache(),
});

export default client;

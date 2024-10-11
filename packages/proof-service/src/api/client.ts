import * as pkg from '@apollo/client';
const { ApolloClient, InMemoryCache, HttpLink } = pkg;

const httpLink = new HttpLink({
  uri: 'http://localhost:5000/graphql',
  fetch,
});

const client = new ApolloClient({
  link: httpLink,
  cache: new InMemoryCache(),
});

export default client;

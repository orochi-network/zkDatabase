import { GraphQLClient } from 'graphql-request';

const endpoint = 'http://localhost:4000/graphql';
const client = new GraphQLClient(endpoint);

export default client;
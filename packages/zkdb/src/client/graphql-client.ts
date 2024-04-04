import { GraphQLClient } from 'graphql-request';

const endpoint = 'YOUR_GRAPHQL_ENDPOINT';
const client = new GraphQLClient(endpoint);

export default client;
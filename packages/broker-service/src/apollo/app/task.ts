import GraphQLJSON from 'graphql-type-json';
import { getNextTaskId } from '../../domain/get-next-task.js';

export const typeDefsTask = `#graphql
scalar JSON
type Query

extend type Query {
  taskId: String
}
`;

const taskId = async () => getNextTaskId();

export const resolversTask = {
  JSON: GraphQLJSON,
  Query: {
    taskId,
  }
};
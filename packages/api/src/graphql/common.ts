import { ApolloClient, OperationVariables } from "@apollo/client";
import { GraphQLResult } from "../utils/result.js";

export type TAsyncGraphQLResult<T> = Promise<GraphQLResult<T>>;

/**
 * Creates a query function that executes a GraphQL query and processes the result.
 *
 * @template T - The type of the processed result.
 * @template Req - The type of the request variables. Defaults to `any`.
 * @template Res - The type of the response data. Defaults to `any`.
 *
 * @param {any} query - The GraphQL query to be executed.
 * @param {(data: Res) => T | any} postProcess - A function to process the result of the query.
 *
 * @returns {TAsyncGraphQLResult<T>} A promise that resolves to a `GraphQLResult` containing the processed result.
 *
 * @example
 * ```typescript
 * const query = gql`
 *   query GetUser($id: ID!) {
 *     user(id: $id) {
 *       id
 *       name
 *     }
 *   }
 * `;
 *
 * const postProcess = (res: ApolloQueryResult<{ user: User }>) => res.data.user;
 *
 * const getUser = createQueryFunction<User, { id: string }, { user: User }>(query, { id: '123' }, postProcess);
 *
 * getUser().then(result => {
 *   if (result.isSuccess()) {
 *     console.log(result.data);
 *   } else {
 *     console.error(result.error);
 *   }
 * });
 * ```
 */
export const createQueryFunction = <T, Req = any, Res = any>(
  client: ApolloClient<any>,
  query: any,
  postProcess: (data: Res) => T | any
) => {
  return async (variables: Req | undefined): Promise<GraphQLResult<T>> => {
    try {
      const { data, errors } = await client.query<
        Res,
        Req extends OperationVariables ? any : any
      >({
        query,
        variables: variables as any,
      });
      if (!errors && data) {
        return GraphQLResult.wrap(postProcess(data));
      } else {
        return GraphQLResult.wrap<T>(
          errors ?? new Error("Unknown error, unable to perform query")
        );
      }
    } catch (error: any) {
      return GraphQLResult.wrap(error);
    }
  };
};

/**
 * Creates a mutation function that executes a GraphQL mutation and processes the result.
 *
 * @template T - The type of the processed result.
 * @template Req - The type of the request variables. Defaults to `any`.
 * @template Res - The type of the response data. Defaults to `any`.
 *
 * @param {any} mutation - The GraphQL mutation to be executed.
 * @param {(data: Res) => T | any} postProcess - A function to process the result of the mutation.
 *
 * @returns {TAsyncGraphQLResult<T>} - A promise that resolves to a wrapped GraphQL result.
 */
export const createMutateFunction = <T, Req = any, Res = any>(
  client: ApolloClient<any>,
  mutation: any,
  postProcess: (data: Res) => T | any
) => {
  return async (variables: Req | undefined): Promise<GraphQLResult<T>> => {
    try {
      const { data, errors } = await client.mutate<
        Res,
        Req extends OperationVariables ? any : any
      >({
        mutation,
        variables: variables as any,
      });
      if (!errors && data) {
        return GraphQLResult.wrap(postProcess(data));
      } else {
        return GraphQLResult.wrap<T>(
          errors ?? new Error("Unknown error, unable to perform query")
        );
      }
    } catch (error: any) {
      return GraphQLResult.wrap(error);
    }
  };
};
import { OperationVariables, ApolloClient, DocumentNode } from "@apollo/client";
import { GraphQLResult } from "@utils";

export type TAsyncGraphQLResult<T> = Promise<GraphQLResult<T>>;

export type TOperationVariables = OperationVariables;

export type TApolloClient<T> = ApolloClient<T>;

/**
 * Creates a query function that executes a GraphQL query and processes the result.
 *
 * @template Req - The type of the request variables. Defaults to `any`.
 * @template Res - The type of the response data. Defaults to `any`.
 *
 * @param {any} query - The GraphQL query to be executed.
 * @param {(data: any) => Res} postProcess - A function to process the result of the query.
 *
 * @returns {TAsyncGraphQLResult<Res>} A promise that resolves to a `GraphQLResult` containing the processed result.
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
export const createQueryFunction = <Req = any, Res = any>(
  client: TApolloClient<any>,
  query: DocumentNode,
  postProcess: (data: any) => Res | any
) => {
  return async (variables: Req | undefined): TAsyncGraphQLResult<Res> => {
    try {
      const { data, errors } = await client.query<
        Res,
        Req extends TOperationVariables ? any : any
      >({
        query,
        variables: variables as any,
      });
      if (!errors && data) {
        return GraphQLResult.wrap(postProcess(data as Res));
      }
      return GraphQLResult.wrap<Res>(
        errors ?? new Error("Unknown error, unable to perform query")
      );
    } catch (error: any) {
      return GraphQLResult.wrap(error);
    }
  };
};

/**
 * Creates a mutation function that executes a GraphQL mutation and processes the result.
 *
 * @template Req - The type of the request variables. Defaults to `any`.
 * @template Res - The type of the response data. Defaults to `any`.
 *
 * @param {any} mutation - The GraphQL mutation to be executed.
 * @param {(data: any) => Res } postProcess - A function to process the result of the mutation.
 *
 * @returns {TAsyncGraphQLResult<Rs>} - A promise that resolves to a wrapped GraphQL result.
 */
export const createMutateFunction = <Req = any, Res = any>(
  client: TApolloClient<any>,
  mutation: DocumentNode,
  postProcess: (data: any) => Res | any
) => {
  return async (variables: Req | undefined): TAsyncGraphQLResult<Res> => {
    try {
      const { data, errors } = await client.mutate<
        Res,
        Req extends TOperationVariables ? any : any
      >({
        mutation,
        variables: variables as any,
      });
      if (!errors && data) {
        return GraphQLResult.wrap(postProcess(data));
      } else {
        return GraphQLResult.wrap<Res>(
          errors ?? new Error("Unknown error, unable to perform query")
        );
      }
    } catch (error: any) {
      return GraphQLResult.wrap(error);
    }
  };
};

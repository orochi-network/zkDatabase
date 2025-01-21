import { OperationVariables, ApolloClient, DocumentNode } from "@apollo/client";
import { GraphQLResult } from "@utils";

export type TAsyncGraphQLResult<T> = Promise<GraphQLResult<T>>;

export type TOperationVariables = OperationVariables;

export type TApolloClient<T> = ApolloClient<T>;

export const createApi = <Req = any, Res = any>(
  client: TApolloClient<any>,
  documentNode: DocumentNode,
  postProcess?: (response: Res) => Res
) => {
  return async (variables: Req | undefined): TAsyncGraphQLResult<Res> => {
    // @NOTE: This is a hack to access private property of document node
    // be careful when you update @apollo/client
    const {
      operation,
      selectionSet: {
        selections: [
          {
            name: { value },
          },
        ],
      },
    } = documentNode.definitions[0] as any;

    if (operation !== "mutation" && operation !== "query") {
      throw new Error(`Unknown operation ${operation}`);
    }

    if (typeof value !== "string") {
      throw new Error(`Unknown method`);
    }

    try {
      const { data, errors } =
        operation === "mutation"
          ? await client.mutate<
              Res,
              Req extends TOperationVariables ? any : any
            >({
              mutation: documentNode,
              variables: variables as any,
            })
          : await client.query<
              Res,
              Req extends TOperationVariables ? any : any
            >({
              query: documentNode,
              variables: variables as any,
            });
      if (!errors && data) {
        const anyData = data as any;
        // @NOTE: null is a validate according to GraphQL and MongoDB
        if (typeof anyData[value] === "undefined") {
          throw new Error("Wrong data format");
        }
        return GraphQLResult.wrap(
          postProcess ? postProcess(anyData[value]) : anyData[value]
        );
      }
      return GraphQLResult.wrap<Res>(
        errors ?? new Error("Unknown error, unable to perform query")
      );
    } catch (error: any) {
      return GraphQLResult.wrap(error);
    }
  };
};

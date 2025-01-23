import { GraphQLResolveInfo, Kind } from 'graphql';

export class GraphqlHelper {
  /**
   * Get the index of the requested field in the GraphQL query by traversing
   * the path.
   *
   * For example, given the following query:
   * ```graphql
   * query {
   *  user {
   *   name
   *   age
   *   address {
   *    street
   *    city
   *   }
   *  }
   * }
   * ```
   * The path `['user', 'address', 'city']` will return 1, as it is the second
   * field in the `address` object. The path `['user', 'gender']` will return
   * -1, as the `gender` field does not exist.
   *
   * @param info - The GraphQL resolve info that was passed to the resolver.
   * @param path - The path array to traverse and find the field.
   * @returns - The index of the requested field, or undefined if not found.
   */
  public static getRequestedFieldIndex(
    info: GraphQLResolveInfo,
    path: string[]
  ): number | undefined {
    let selections = info.fieldNodes[0].selectionSet?.selections;

    for (let i = 0; i < path.length - 1; i += 1) {
      const fieldName = path[i];
      const fieldNode = selections?.find(
        (v) => v.kind === Kind.FIELD && v.name.value === fieldName
      );

      if (!fieldNode || fieldNode.kind !== Kind.FIELD) {
        return undefined;
      }

      selections = fieldNode.selectionSet?.selections;
    }

    const finalFieldName = path[path.length - 1];
    return selections?.findIndex(
      (v) => v.kind === Kind.FIELD && v.name.value === finalFieldName
    );
  }

  /**
   * Check if the requested field exists in the GraphQL query by traversing the
   * path.
   *
   * For example, given the following query:
   * ```graphql
   * query {
   *  user {
   *   name
   *   age
   *   address {
   *    street
   *   }
   *  }
   * }
   * ```
   * The path `['user', 'address', 'street']` will return true, as it is the
   * first field in the `address` object. The path `['user', 'gender']` will
   * return false, as the `gender` field does not exist.
   *
   * @param info - The GraphQL resolve info that was passed to the resolver.
   * @param path - The path array to traverse and find the field.
   * @returns - True if the requested field exists, false otherwise.
   */
  public static checkRequestedFieldExist(
    info: GraphQLResolveInfo,
    path: string[]
  ): boolean {
    const index = this.getRequestedFieldIndex(info, path);
    return index !== undefined && index >= 0;
  }
}

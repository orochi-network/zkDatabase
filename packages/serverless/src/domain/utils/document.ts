export interface FilterCriteria {
  [key: string]: any;
}

/** Parse a arbitrary query to a query that queries either the `docId` or the
 * `document` fields.
 *
 * For example, the input:
 * ```
 * {
 *   docId: '123',
 *   name: 'John',
 *   age: 30,
 *   address: undefined,
 * }
 * ```
 *
 * will be parsed to:
 * ```
 * {
 *   docId: '123',
 *   'document.name.value': 'John',
 *   'document.age.value': 30,
 * }
 * */
export function parseQuery(input: FilterCriteria): FilterCriteria {
  const query: FilterCriteria = {};

  Object.keys(input).forEach((key) => {
    const value = input[key];

    if (value !== undefined) {
      if (key === 'docId') {
        query[key] = String(value);
      } else {
        query[`document.${key}.value`] = value;
      }
    }
  });

  return query;
}

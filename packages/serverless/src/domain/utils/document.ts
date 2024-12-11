export interface FilterCriteria {
  [key: string]: any;
}

/** Parse a arbitrary query to a query that queries either the `docId` or the
 * `document` fields.
 *
 * For example, the input:
 * ```
 * {
 *   "$zkdb::docId": '123',
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
  const listKey = Object.keys(input);
  for (let i = 0; i < listKey.length; i += 1) {
    const key = listKey[i];
    const value = input[key];
    if (typeof value !== 'undefined') {
      if (key.includes('$zkdb::')) {
        query[key.replace('$zkdb::', '')] = String(value);
      } else {
        query[`document.${key}.value`] = value;
      }
    }
  }
  return query;
}

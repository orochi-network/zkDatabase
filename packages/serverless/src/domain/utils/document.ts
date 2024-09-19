export interface FilterCriteria {
  [key: string]: any;
}

export function parseQuery(input: FilterCriteria): FilterCriteria {
  const query: FilterCriteria = {};

  Object.keys(input).forEach((key) => {
    const value = input[key];

    if (value !== undefined) {
      if (key === 'docId') {
        query[key] = String(value);
      } else {
        query[`${key}.value`] = value;
      }
    }
  });

  return query;
}

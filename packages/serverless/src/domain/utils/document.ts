export interface FilterCriteria {
  [key: string]: any;
}

export function parseQuery(input: FilterCriteria): FilterCriteria {
  const query: FilterCriteria = {};

  Object.keys(input).forEach((key) => {
    if (key === 'docId') {
      query[key] = String(input[key]);
    } else {
      query[`${key}.value`] = `${input[key]}`;
    }
  });

  return query;
}

import client from '../graphql-client.js';

export interface ListGroupResponse {
  groups: JSON;
}

export const GROUP_LIST_ALL_QUERY = `
  query GroupListAll($databaseName: String!) {
    groupListAll(databaseName: $databaseName)
  }
`;

export const GROUP_LIST_BY_USER_QUERY = `
  query GroupListByUser($databaseName: String!, $userName: String!) {
    groupListByUser(databaseName: $databaseName, userName: $userName)
  }
`;

export const listAllGroups = async (databaseName: string): Promise<ListGroupResponse> => {
  const variables = { databaseName };
  return client.request<ListGroupResponse>(GROUP_LIST_ALL_QUERY, variables);
};

export const listGroupsByUser = async (
  databaseName: string,
  userName: string
): Promise<ListGroupResponse> => {
  const variables = { databaseName, userName };
  return client.request<ListGroupResponse>(GROUP_LIST_BY_USER_QUERY, variables);
};
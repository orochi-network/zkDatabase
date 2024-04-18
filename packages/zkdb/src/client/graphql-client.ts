import { GraphQLClient } from 'graphql-request';
import LocalStorage from '../storage/local-storage.js';
import { signRequest } from './signer.js';

const endpoint = 'http://localhost:4000/graphql';
const client = new GraphQLClient(endpoint);

async function setAuthorizationHeader() {
  const storage = LocalStorage.getInstance();
  const session = storage.getSession();
  const userInfo = storage.getUserInfo();
  if (session !== undefined && userInfo !== undefined) {
    const token = await signRequest(session, userInfo);
    client.setHeader('Authorization', `Bearer ${token}`)
  } else {
    client.setHeader('Authorization', "")
  }
}

export async function query<T>(
  query: string,
  variables: Record<string, any>
): Promise<T> {
  await setAuthorizationHeader()
  try {
    return await client.request<T>(query, variables);
  } catch (error) {
    throw new Error(`GraphQL query error: ${error}`);
  }
}

export async function mutate<T>(
  mutation: string,
  variables: Record<string, any>
): Promise<T> {
  await setAuthorizationHeader()
  try {
    return await client.request<T>(mutation, variables);
  } catch (error) {
    throw new Error(`GraphQL mutation error: ${error}`);
  }
}

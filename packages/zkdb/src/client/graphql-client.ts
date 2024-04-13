import { GraphQLClient } from 'graphql-request';
import LocalStorage from '../storage/local-storage.js';

const endpoint = 'http://localhost:4000/graphql';

function getAccessToken(): string | null {
    return LocalStorage.getInstance().getAccessToken();
}

let currentToken: string | null = null;
let client: GraphQLClient | null = null;

function createOrUpdateGraphQLClient(): GraphQLClient {
    const token = getAccessToken();

    if (token !== currentToken) {
        currentToken = token;
        client = new GraphQLClient(endpoint, {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
    }
    return client as GraphQLClient;
}

export async function query<T>(query: string, variables?: Record<string, any>): Promise<T> {
    const client = createOrUpdateGraphQLClient();
    try {
        return await client.request<T>(query, variables);
    } catch (error) {
        throw new Error(`GraphQL query error: ${error}`);
    }
}

export async function mutate<T>(mutation: string, variables?: Record<string, any>): Promise<T> {
    const client = createOrUpdateGraphQLClient();
    try {
        return await client.request<T>(mutation, variables);
    } catch (error) {
        throw new Error(`GraphQL mutation error: ${error}`);
    }
}

export function updateToken() {
    createOrUpdateGraphQLClient();
}

import { faker } from '@faker-js/faker';
import { PrivateKey } from 'o1js';

export const PRIVATE_KEY = PrivateKey.random().toBase58();
console.log('🚀 ~ PRIVATE_KEY:', PRIVATE_KEY);
export const SERVERLESS_HOST = 'zkdb-serverless.zenfactory.org/graphql';
export const DB_NAME = faker.lorem.word();
export const ZKDB_URL = `zkdb+http://username:${PRIVATE_KEY}@${SERVERLESS_HOST}?db=${DB_NAME}`;

import { faker } from '@faker-js/faker';
import { PrivateKey } from 'o1js';

 export const DB_NAME = faker.lorem.word({length: {
    min: 4,
    max: 10
 }});

export const PRIVATE_KEY = PrivateKey.random().toBase58();
export const SERVERLESS_HOST = 'test-serverless.zkdatabase.org/graphql';
export const ZKDB_URL = `zkdb+https://username:${PRIVATE_KEY}@${SERVERLESS_HOST}?db=${DB_NAME}`;

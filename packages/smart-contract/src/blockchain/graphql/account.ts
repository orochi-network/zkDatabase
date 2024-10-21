import { gql } from "@apollo/client/core/core.cjs"; 
import { createQueryFunction, TApolloClient } from './common';
import { Account } from '../types/account';
 
export const accounts = <T>(client: TApolloClient<T>) => ({
  getOne: createQueryFunction<Account, { publicKey: string }, { account: any }>(
    client,
    gql`
      query GetAccount($publicKey: String!) {
        account(publicKey: $publicKey) {
          publicKey
          verificationKey {
            verificationKey
            hash
          }
        }
      }
    `,
    (data) => data.account
  ),
});

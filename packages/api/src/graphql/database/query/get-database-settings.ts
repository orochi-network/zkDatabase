import pkg from "@apollo/client";
import {
  createQueryFunction,
  TAsyncGraphQLResult,
} from "../../common.js";
import { TDatabaseSettings } from "../../types/database.js";
const { gql } = pkg;

/**
 * Retrieves the settings for a specified database.
 *
 * This function executes a GraphQL query to fetch the database settings,
 * including the merkle height and public key, for the given database name.
 *
 * @param databaseName - The name of the database for which to retrieve settings.
 * @returns {TAsyncGraphQLResult<TDatabaseSettings>} - An object containing the database settings.
 *
 * @example
 * ```typescript
 * const settings = await getDatabaseSettings({ databaseName: 'myDatabase' });
 * console.log(settings.merkleHeight);
 * console.log(settings.publicKey);
 * ```
 */
export const getDatabaseSettings = createQueryFunction<
  TDatabaseSettings,
  { databaseName: string },
  { dbSetting: TDatabaseSettings }
>(
  gql`
    query GetDbSettings($databaseName: String!) {
      dbSetting(databaseName: $databaseName) {
        merkleHeight
        publicKey
      }
    }
  `,
  (data) => data.dbSetting
);

import { TDbRecord } from "./common.js";

export type TDbSetting = TDbRecord<{
  databaseName: string;
  databaseOwner: string;
  merkleHeight: number;
  appPublicKey: string;
}>;

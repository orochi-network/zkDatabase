import { zkDatabaseConstants } from '../../common/const.js';
import ModelGeneral from '../base/general.js';

export type NetworkId = 'mainnet' | 'devnet';

export type Network = {
  networkId: NetworkId
  endpoint: string
  active: boolean
};

export class ModelNetwork extends ModelGeneral<Network> {
  public static instance: ModelNetwork;

  public static getInstance(): ModelNetwork {
    if (!this.instance) {
      this.instance = new ModelNetwork(
        zkDatabaseConstants.globalDatabase,
        zkDatabaseConstants.globalCollections.network
      );
    }
    return this.instance;
  }
}

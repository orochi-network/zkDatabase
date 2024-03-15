import { Mina, PublicKey, fetchAccount } from 'o1js';

export default class SmartContractService {
  private constructor() {
    const MINAURL = 'https://proxy.berkeley.minaexplorer.com/graphql';
    const ARCHIVEURL = 'https://archive.berkeley.minaexplorer.com';
    const network = Mina.Network({
      mina: MINAURL,
      archive: ARCHIVEURL,
    });
    Mina.setActiveInstance(network);
  }

  public async getActions(zkAppAddress: string, amount: number = 10): Promise<string[][]> {
    const result = await fetchAccount({
      publicKey: PublicKey.fromBase58(zkAppAddress),
    });

    if (!result || result.error) {
      throw Error();
    }

    const account = result.account!;

    const fromActionState = account.zkapp!.appState[0]!;

    const actions = await Mina.fetchActions(
      PublicKey.fromBase58(zkAppAddress),
      { fromActionState },
      account.tokenId
    );

    if ('error' in actions) {
      throw Error(JSON.stringify(result));
    }

    return actions[0].actions.slice(0, amount);
  }

  public static getInstance(): SmartContractService {
    return new SmartContractService();
  }
}

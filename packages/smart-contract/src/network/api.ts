import logger from "src/helper/logger";

export type TChain = 'mainnet' | 'devnet';

export type TBlockConfirmationTransaction = {
  blockConfirmationsCount: number;
  blockHeight: number;
  stateHash: string;
  txHashNext: string;
  txHashPrevious: string;
  isCanonical: boolean;
  failureReason: string;
};

export class BlockberryApi {
  private chain: TChain;
  #apiKey: string;

  constructor(apiKey: string, chain: TChain) {
    this.#apiKey = apiKey;
    this.chain = chain;
  }

  public async getBlockConfirmationByTransactionHash(
    txHash: string
  ): Promise<TBlockConfirmationTransaction | undefined> {
    const options = {
      method: 'GET',
      headers: {
        accept: 'application/json',
        'x-api-key': this.#apiKey,
      },
    };

    try {
      const response = await fetch(
        `https://api.blockberry.one/mina-${this.chain}/v1/block-confirmation/${txHash}`,
        options
      );
      if (!response.ok) {
        logger.error('response:', response);
        return undefined;
      }
      const result = await response.json();
      return result as TBlockConfirmationTransaction;
    } catch (err) {
      logger.error(err);
      return undefined;
    }
  }
}

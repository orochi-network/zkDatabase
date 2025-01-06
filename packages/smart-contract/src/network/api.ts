import { logger } from '../helper/logger.js';

export type TChain = 'mainnet' | 'devnet';

export type TStatus = 'applied' | 'failed' | 'pending';

export type TBlockConfirmationTransaction = {
  blockConfirmationsCount: number;
  blockHeight: number;
  stateHash: string;
  txHashNext: string;
  txStatus: TStatus;
  txHashPrevious: string;
  isCanonical: boolean;
  failureReason: string;
};

export type TZkAppTransaction = {
  txStatus: TStatus;
  failures: string[];
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
        logger.error(
          'Error response from blockberry getBlockConfirmationByTransactionHash:',
          response
        );
        return undefined;
      }
      const result = await response.json();
      return result;
    } catch (err) {
      logger.error('Cannot getBlockConfirmationByTransactionHash ', err);
      return undefined;
    }
  }

  public async getZkAppTransactionByTxHash(
    txHash: string
  ): Promise<TZkAppTransaction | undefined> {
    const options = {
      method: 'GET',
      headers: {
        accept: 'application/json',
        'x-api-key': this.#apiKey,
      },
    };

    try {
      const response = await fetch(
        `https://api.blockberry.one/mina-${this.chain}/v1/zkapps/txs/${txHash}`,
        options
      );
      if (!response.ok) {
        logger.error(
          'Error response from blockberry getZkAppTransactionByTxHash:',
          response
        );
        return undefined;
      }
      const result = await response.json();
      return result as TZkAppTransaction;
    } catch (err) {
      logger.error('Cannot getZkAppTransactionByTxHash ', err);
      return undefined;
    }
  }
}

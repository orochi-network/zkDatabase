import {
  AddChainArgs,
  ChainInfoArgs,
  CreateNullifierArgs,
  Nullifier,
  ProviderError,
  RequestArguments,
  SendPaymentArgs,
  SendStakeDelegationArgs,
  SendTransactionArgs,
  SendTransactionResult,
  SendZkTransactionResult,
  SignFieldsArguments,
  SignJsonMessageArgs,
  SignMessageArgs,
  SignedData,
  SignedFieldsData,
  SwitchChainArgs,
  VerifyFieldsArguments,
  VerifyJsonMessageArgs,
  VerifyMessageArgs,
} from '@aurowallet/mina-provider';
import { IMinaProvider } from '@aurowallet/mina-provider/dist/IProvider';
import { sendTransaction } from '@zkdb/smart-contract';
import Client from 'mina-signer';
import { NetworkId, PrivateKey, fetchAccount } from 'o1js';

export class NodeProvider implements IMinaProvider {
  #privateKey: PrivateKey;

  #client: Client;

  #endpoint: string;

  constructor(privateKey: PrivateKey, network: NetworkId) {
    this.#privateKey = privateKey;
    if (network === 'testnet') {
      this.#client = new Client({ network: 'testnet' });
      this.#endpoint = 'https://api.minascan.io/node/devnet/v1/graphql';
    } else if (network === 'mainnet') {
      this.#client = new Client({ network: 'mainnet' });
      this.#endpoint = 'https://api.minascan.io/node/mainnet/v1/graphql';
    } else {
      throw Error('Invalid network');
    }
  }

  public privateKey(): string {
    return this.#privateKey.toBase58();
  }

  public static generate(networkId: NetworkId): NodeProvider {
    return new NodeProvider(PrivateKey.random(), networkId);
  }

  request(args: RequestArguments): Promise<unknown> {
    throw new Error('Method not implemented.');
  }

  async sendTransaction(
    args: SendTransactionArgs
  ): Promise<SendZkTransactionResult | ProviderError> {
    const publicKey = this.#privateKey.toPublicKey();
    const { transaction, feePayer } = args;
    const { account, error } = await fetchAccount(
      { publicKey },
      this.#endpoint
    );

    if (error) {
      throw Error(error.statusText);
    }
    if (!account) {
      throw Error('Account has not been bound');
    }

    const signBody = {
      zkappCommand:
        typeof transaction === 'string' ? JSON.parse(transaction) : transaction,
      feePayer: {
        feePayer: publicKey.toBase58(),
        fee: feePayer?.fee ?? 0,
        nonce: account.nonce.toBigint(),
        memo: feePayer?.memo ?? '',
      },
    };

    const signedLegacy = this.#client.signTransaction(
      signBody,
      this.#privateKey.toBase58()
    );

    const result = await sendTransaction(
      {
        zkappCommand: signedLegacy.data.zkappCommand,
        signature: signedLegacy.signature,
      },
      this.#endpoint
    );

    return result;
  }

  sendPayment(
    args: SendPaymentArgs
  ): Promise<SendTransactionResult | ProviderError> {
    throw new Error('Method not implemented.');
  }

  sendStakeDelegation(
    args: SendStakeDelegationArgs
  ): Promise<SendTransactionResult | ProviderError> {
    throw new Error('Method not implemented.');
  }

  async signMessage(
    args: SignMessageArgs
  ): Promise<SignedData | ProviderError> {
    return this.#client.signMessage(args.message, this.#privateKey.toBase58());
  }

  async verifyMessage(
    args: VerifyMessageArgs
  ): Promise<boolean | ProviderError> {
    return this.verifyMessage(args);
  }

  requestAccounts(): Promise<string[] | ProviderError> {
    throw new Error('Method not implemented.');
  }

  requestNetwork(): Promise<ChainInfoArgs> {
    throw new Error('Method not implemented.');
  }

  signFields(
    args: SignFieldsArguments
  ): Promise<SignedFieldsData | ProviderError> {
    throw new Error('Method not implemented.');
  }

  verifyFields(args: VerifyFieldsArguments): Promise<boolean | ProviderError> {
    throw new Error('Method not implemented.');
  }

  signJsonMessage(
    args: SignJsonMessageArgs
  ): Promise<SignedData | ProviderError> {
    throw new Error('Method not implemented.');
  }

  verifyJsonMessage(
    args: VerifyJsonMessageArgs
  ): Promise<boolean | ProviderError> {
    throw new Error('Method not implemented.');
  }

  createNullifier(
    args: CreateNullifierArgs
  ): Promise<Nullifier | ProviderError> {
    throw new Error('Method not implemented.');
  }

  addChain(args: AddChainArgs): Promise<ChainInfoArgs | ProviderError> {
    throw new Error('Method not implemented.');
  }

  switchChain(args: SwitchChainArgs): Promise<ChainInfoArgs | ProviderError> {
    throw new Error('Method not implemented.');
  }

  on(eventName: unknown, listener: unknown): this {
    throw new Error('Method not implemented.');
  }

  removeListener(eventName: unknown, listener: unknown): this {
    throw new Error('Method not implemented.');
  }
}

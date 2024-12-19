import { logger } from '@helper';
import { ZKDatabaseSmartContractWrapper } from '@zkdb/smart-contract';
import { JsonProof, Mina, NetworkId, PrivateKey, PublicKey } from 'o1js';

const MAX_MERKLE_TREE_HEIGHT = 256;
const MIN_MERKLE_TREE_HEIGHT = 8;

export class ZkCompile {
  private smartContractMap: Map<number, ZKDatabaseSmartContractWrapper>;

  constructor(
    private readonly network: { networkId: NetworkId; mina: string }
  ) {
    // Set active network
    Mina.setActiveInstance(Mina.Network(this.network));
    // Smart contract map with key is merkleHeight and value is smart contract
    this.smartContractMap = new Map<number, ZKDatabaseSmartContractWrapper>();
  }

  private async getSmartContract(
    merkleHeight: number
  ): Promise<ZKDatabaseSmartContractWrapper> {
    if (
      merkleHeight > MAX_MERKLE_TREE_HEIGHT ||
      merkleHeight < MIN_MERKLE_TREE_HEIGHT
    ) {
      throw new Error(
        `Valid merkle height, ensure it between from ${MIN_MERKLE_TREE_HEIGHT} to ${MAX_MERKLE_TREE_HEIGHT}`
      );
    }
    if (!this.smartContractMap.has(merkleHeight)) {
      const zkWrapper =
        ZKDatabaseSmartContractWrapper.mainConstructor(merkleHeight);
      await zkWrapper.compile();
      // set ZKDatabaseSmartContractWrapper
      this.smartContractMap.set(merkleHeight, zkWrapper);
    }
    // Need to using null assertion since we already check if
    return this.smartContractMap.get(merkleHeight)!;
  }

  async getDeployRawTx(
    payerAddress: string,
    zkDbPrivateKey: PrivateKey,
    merkleHeight: number
  ): Promise<string> {
    this.ensureTransaction();

    const zkDbPublicKey = PublicKey.fromPrivateKey(zkDbPrivateKey);
    const senderPublicKey = PublicKey.fromBase58(payerAddress);

    const start = performance.now();

    const smartContract = await this.getSmartContract(merkleHeight);

    const unsignedTx = await smartContract.createAndProveDeployTransaction({
      sender: senderPublicKey,
      zkApp: zkDbPublicKey,
    });

    const partialSignedTx = unsignedTx.sign([zkDbPrivateKey]);

    const end = performance.now();
    logger.info(
      `Deploy ${zkDbPublicKey.toBase58()} take ${(end - start) / 1000}s`
    );

    return partialSignedTx.toJSON();
  }

  async getRollupRawTx(
    payerAddress: string,
    zkDbPrivateKey: PrivateKey,
    merkleHeight: number,
    proof: JsonProof
  ): Promise<string> {
    this.ensureTransaction();

    const zkDbPublicKey = PublicKey.fromPrivateKey(zkDbPrivateKey);
    const senderPublicKey = PublicKey.fromBase58(payerAddress);

    const start = performance.now();

    const smartContract = await this.getSmartContract(merkleHeight);

    const rawTx = await smartContract.createAndProveRollUpTransaction(
      {
        sender: senderPublicKey,
        zkApp: zkDbPublicKey,
      },
      proof
    );

    const partialSignedTx = rawTx.sign([zkDbPrivateKey]);

    const end = performance.now();
    logger.info(
      `Roll-up ${zkDbPublicKey.toBase58()} take ${(end - start) / 1000}s`
    );

    return partialSignedTx.toJSON();
  }

  private ensureTransaction() {
    // Ensure 1 mina transaction can be process at time
    if (Mina.currentTransaction.has()) {
      logger.debug(
        `${Mina.currentTransaction.get()}, data: ${Mina.currentTransaction.data}`
      );
      throw Error('Transaction within transaction identified');
    }
  }
}

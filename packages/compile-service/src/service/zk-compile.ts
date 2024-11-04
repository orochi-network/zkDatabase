import { logger } from "@helper";
import { MinaTransaction, ZKDatabaseSmartContractWrapper } from "@zkdb/smart-contract";
import { ModelDbSetting } from "@zkdb/storage";
import { JsonProof, Mina, PrivateKey, PublicKey } from "o1js";

const MAX_MERKLE_TREE_HEIGHT = 128;

export type UnsignedTransaction = string;

export class ZkCompileService {
  private compiledSmartContracts: Array<ZKDatabaseSmartContractWrapper>;

  constructor(
    private readonly network: { networkId: "testnet" | "mainnet"; mina: string }
  ) {
    // Set active network
    Mina.setActiveInstance(Mina.Network(this.network));
    this.compiledSmartContracts = new Array(MAX_MERKLE_TREE_HEIGHT);
  }

  private async getSmartContract(
    merkleHeight: number
  ): Promise<ZKDatabaseSmartContractWrapper> {
    if (!this.compiledSmartContracts[merkleHeight - 1]) {
      const zkWrapper = new ZKDatabaseSmartContractWrapper(merkleHeight);
      await zkWrapper.compile();
      this.compiledSmartContracts[merkleHeight - 1] = zkWrapper;
    }

    return this.compiledSmartContracts[merkleHeight - 1];
  }

  async compileAndCreateDeployUnsignTx(
    payerAddress: string,
    zkDbPrivateKey: PrivateKey,
    merkleHeight: number,
    databaseName: string
  ): Promise<UnsignedTransaction> {
    try {
      const zkDbPublicKey = PublicKey.fromPrivateKey(zkDbPrivateKey);

      const start = performance.now();

      const zkWrapper = await this.getSmartContract(merkleHeight);

      const unsignedTx = await zkWrapper.createAndProveDeployTransaction({
        sender: PublicKey.fromBase58(payerAddress),
        zkApp: zkDbPublicKey,
      });

      const partialSignedTx = unsignedTx.sign([zkDbPrivateKey]);

      await ModelDbSetting.getInstance().updateSetting(databaseName, {
        appPublicKey: zkDbPublicKey.toBase58(),
      });

      const end = performance.now();
      logger.info(
        `Deploy ${zkDbPublicKey.toBase58()} take ${(end - start) / 1000}s`
      );

      return partialSignedTx.toJSON();
    } catch (error) {
      logger.error(`Cannot compile & deploy: ${databaseName}`, logger);
      await ModelDbSetting.getInstance().updateSetting(databaseName, {
        appPublicKey: undefined,
      });
      throw error;
    }
  }

  async compileAndCreateRollUpUnsignTx(
    payerAddress: string,
    zkDbPrivateKey: PrivateKey,
    merkleHeight: number,
    proof: JsonProof
  ): Promise<UnsignedTransaction> {
    const zkDbPublicKey = PublicKey.fromPrivateKey(zkDbPrivateKey);

    const start = performance.now();

    const zkWrapper = await this.getSmartContract(merkleHeight);

    const unsignedTx = await zkWrapper.createAndProveRollUpTransaction(
      {
        sender: PublicKey.fromBase58(payerAddress),
        zkApp: zkDbPublicKey,
      },
      proof
    );

    const partialSignedTx = unsignedTx.sign([zkDbPrivateKey]);
    const end = performance.now();
    logger.info(
      `Roll-up ${zkDbPublicKey.toBase58()} take ${(end - start) / 1000}s`
    );

    return partialSignedTx.toJSON();
  }
}

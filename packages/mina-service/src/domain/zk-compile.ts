import { logger } from '@helper';
import { TZkDatabaseProof } from '@zkdb/common';
import { ZkDbProcessor } from '@zkdb/smart-contract';
import {
  AccountUpdate,
  Mina,
  NetworkId,
  PrivateKey,
  PublicKey,
  ZkProgram,
} from 'o1js';

export class ZkCompile {
  constructor(
    private readonly network: { networkId: NetworkId; mina: string }
  ) {
    // Set active network
    Mina.setActiveInstance(Mina.Network(this.network));
    // Smart contract map with key is merkleHeight and value is smart contract
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

    const zkDbProcessor = new ZkDbProcessor(merkleHeight);

    await zkDbProcessor.compile('');

    const smartContract = zkDbProcessor.getInstanceZkDBContract(zkDbPublicKey);

    const tx = await Mina.transaction(
      {
        sender: senderPublicKey,
        fee: 100_000_000,
      },
      async () => {
        AccountUpdate.fundNewAccount(senderPublicKey);
        await smartContract.deploy();
      }
    );

    await tx.prove();

    const partialSignedTx = await tx.sign([zkDbPrivateKey]);

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
    proof: TZkDatabaseProof
  ): Promise<string> {
    this.ensureTransaction();

    const zkDbPublicKey = PublicKey.fromPrivateKey(zkDbPrivateKey);
    const senderPublicKey = PublicKey.fromBase58(payerAddress);

    const start = performance.now();

    const zkDbProcessor = new ZkDbProcessor(merkleHeight);

    await zkDbProcessor.compile('');

    const smartContract = zkDbProcessor.getInstanceZkDBContract(zkDbPublicKey);
    const proofProgram = ZkProgram.Proof(zkDbProcessor.getInstanceZkDBRollup());

    const tx = await Mina.transaction(
      {
        sender: senderPublicKey,
        fee: 100_000_000,
      },
      async () => {
        await smartContract.rollUp(await proofProgram.fromJSON(proof));
      }
    );

    await tx.prove();

    const partialSignedTx = tx.sign([zkDbPrivateKey]);

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

import { CACHE_PATH, logger } from '@helper';
import { TVerificationKeySerialized, TZkDatabaseProof } from '@zkdb/common';
import { ZkDbProcessor } from '@zkdb/smart-contract';
import { getCurrentTime, ModelVerificationKey } from '@zkdb/storage';
import { createHash } from 'node:crypto';
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

    const { zkdbContract, zkdbRollup } =
      await zkDbProcessor.compile(CACHE_PATH);

    const imVerification = ModelVerificationKey.getInstance();

    const contractVerificationKeySerialized: TVerificationKeySerialized = {
      ...zkdbContract.verificationKey,
      hash: zkdbContract.verificationKey.hash.toString(),
    };

    const rollupVerificationKeySerialized: TVerificationKeySerialized = {
      ...zkdbRollup.verificationKey,
      hash: zkdbRollup.verificationKey.hash.toString(),
    };

    // Using SHA-256 hash from 'crypto' to hash verification key

    const contractVerificationKeyHash = createHash('sha256')
      .update(JSON.stringify(contractVerificationKeySerialized))
      .digest('hex');

    const rollupVerificationKeyHash = createHash('sha256')
      .update(JSON.stringify(rollupVerificationKeySerialized))
      .digest('hex');

    await imVerification.insertMany([
      {
        contractName: 'zkdb-contract',
        verificationKeyHash: contractVerificationKeyHash,
        verificationKey: contractVerificationKeySerialized,
        createdAt: getCurrentTime(),
        updatedAt: getCurrentTime(),
      },
      {
        contractName: 'zkdb-rollup',
        verificationKeyHash: rollupVerificationKeyHash,
        verificationKey: rollupVerificationKeySerialized,
        createdAt: getCurrentTime(),
        updatedAt: getCurrentTime(),
      },
    ]);

    // Store smart contract's verification key into database and hashed like hash table for key hash and value
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

    const partialSignedTx = tx.sign([zkDbPrivateKey]);

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

    await zkDbProcessor.compile(CACHE_PATH);

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

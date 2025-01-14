import { logger } from '@helper';
import {
  EContractName,
  TRollupSerializedProof,
  TVerificationKeySerialized,
} from '@zkdb/common';
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

const DEFAULT_TRANSACTION_FEE = 100_000_000;

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

    const zkDbProcessor = await ZkDbProcessor.getInstance(merkleHeight);

    const { vkContract, vkRollup } = zkDbProcessor;

    const contractVerificationKeySerialized: TVerificationKeySerialized = {
      ...vkContract,
      hash: vkContract.hash.toString(),
    };

    const rollupVerificationKeySerialized: TVerificationKeySerialized = {
      ...vkRollup,
      hash: vkRollup.hash.toString(),
    };

    // Store smart contract's verification key into database and hashed like hash table for key hash and value
    // Using SHA-256 hash from 'crypto' to hash verification key
    const contractVerificationKeyHash = createHash('sha256')
      .update(JSON.stringify(contractVerificationKeySerialized))
      .digest('hex');

    const rollupVerificationKeyHash = createHash('sha256')
      .update(JSON.stringify(rollupVerificationKeySerialized))
      .digest('hex');

    const imVerification = ModelVerificationKey.getInstance();

    // Insert these 2 vk contract & rollup to database
    await imVerification.insertMany([
      {
        type: EContractName.VkContract,
        verificationKeyHash: contractVerificationKeyHash,
        verificationKey: contractVerificationKeySerialized,
        createdAt: getCurrentTime(),
        updatedAt: getCurrentTime(),
      },
      {
        type: EContractName.VkRollup,
        verificationKeyHash: rollupVerificationKeyHash,
        verificationKey: rollupVerificationKeySerialized,
        createdAt: getCurrentTime(),
        updatedAt: getCurrentTime(),
      },
    ]);

    // Get the smart contract from zk processor to `deploy()`
    const smartContract = zkDbProcessor.getInstanceZkDBContract(zkDbPublicKey);

    const tx = await Mina.transaction(
      {
        sender: senderPublicKey,
        fee: DEFAULT_TRANSACTION_FEE,
      },
      async () => {
        AccountUpdate.fundNewAccount(senderPublicKey);
        await smartContract.deploy();
      }
    );

    await tx.prove();

    const partialSignedTx = tx.sign([zkDbPrivateKey]);

    return partialSignedTx.toJSON();
  }

  async getRollupRawTx(
    payerAddress: string,
    zkDbPrivateKey: PrivateKey,
    merkleHeight: number,
    proof: TRollupSerializedProof['proof']
  ): Promise<string> {
    this.ensureTransaction();

    const zkDbPublicKey = PublicKey.fromPrivateKey(zkDbPrivateKey);
    const senderPublicKey = PublicKey.fromBase58(payerAddress);

    const start = performance.now();

    const zkDbProcessor = await ZkDbProcessor.getInstance(merkleHeight);

    // Get smart contract to rollup and get proof zkProgram from a JSON
    const smartContract = zkDbProcessor.getInstanceZkDBContract(zkDbPublicKey);
    const proofProgram = ZkProgram.Proof(zkDbProcessor.getInstanceZkDBRollup());

    const tx = await Mina.transaction(
      {
        sender: senderPublicKey,
        fee: DEFAULT_TRANSACTION_FEE,
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

import { logger } from '@helper';
import {
  EContractName,
  TRollupSerializedProof,
  TVerificationKeySerialized,
} from '@zkdb/common';
import { ZkDbProcessor } from '@zkdb/smart-contract';
import { ModelVerificationKey } from '@zkdb/storage';
import { ClientSession } from 'mongodb';
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

  public async getDeployRawTx(
    payerAddress: string,
    zkDbPrivateKey: PrivateKey,
    merkleHeight: number
  ): Promise<string> {
    this.ensureTransaction();

    const zkDbPublicKey = PublicKey.fromPrivateKey(zkDbPrivateKey);
    const senderPublicKey = PublicKey.fromBase58(payerAddress);

    const zkDbProcessor = await ZkDbProcessor.getInstance(merkleHeight);

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

  public async getRollupRawTx(
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

  public async verificationKeySet(
    databaseName: string,
    merkleHeight: number,
    session: ClientSession
  ): Promise<boolean> {
    const zkDbProcessor = await ZkDbProcessor.getInstance(merkleHeight);

    const contractVerificationKeySerialized: TVerificationKeySerialized = {
      data: zkDbProcessor.vkContract.data,
      hash: zkDbProcessor.vkContract.hash.toString(),
    };

    const rollupVerificationKeySerialized: TVerificationKeySerialized = {
      data: zkDbProcessor.vkRollup.data,
      hash: zkDbProcessor.vkRollup.hash.toString(),
    };

    // Store smart contract's verification key into database and hashed like hash table for key hash and value
    // Using SHA-256 hash from 'crypto' to hash verification key
    const contractVerificationKeyHash = createHash('sha256')
      .update(Buffer.from(zkDbProcessor.vkContract.data, 'base64'))
      .update(zkDbProcessor.vkContract.hash.toString())
      .digest('hex');

    const rollupVerificationKeyHash = createHash('sha256')
      .update(Buffer.from(zkDbProcessor.vkRollup.data, 'base64'))
      .update(zkDbProcessor.vkRollup.hash.toString())
      .digest('hex');

    const imVerification = ModelVerificationKey.getInstance();

    // Insert these 2 vk contract & rollup to database
    const vkInsertResult = await imVerification.insertMany(
      [
        {
          databaseName,
          contractName: EContractName.Contract,
          verificationKeyHash: contractVerificationKeyHash,
          verificationKey: contractVerificationKeySerialized,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          databaseName,
          contractName: EContractName.Rollup,
          verificationKeyHash: rollupVerificationKeyHash,
          verificationKey: rollupVerificationKeySerialized,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
      {
        session,
      }
    );
    return vkInsertResult.acknowledged;
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

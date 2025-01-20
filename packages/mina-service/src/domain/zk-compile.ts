import { logger } from '@helper';
import { EContractName, TRollupSerializedProof } from '@zkdb/common';
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
  VerificationKey,
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

  private static verificationKeyToDBRecord(
    contractName: EContractName,
    merkleHeight: number,
    vk: VerificationKey
  ) {
    const { data, hash } = vk;
    const hashStr = hash.toString();
    const verificationKeyHash = createHash('sha256')
      .update(Buffer.from(data, 'base64'))
      .update(hashStr)
      .digest('hex');

    return {
      contractName,
      merkleHeight,
      verificationKeyHash,
      data,
      hash: hashStr,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
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
    merkleHeight: number,
    session: ClientSession
  ): Promise<boolean> {
    const zkDbProcessor = await ZkDbProcessor.getInstance(merkleHeight);
    const imVerification = ModelVerificationKey.getInstance();

    const vkContractRecord = ZkCompile.verificationKeyToDBRecord(
      EContractName.Contract,
      merkleHeight,
      zkDbProcessor.vkContract
    );
    const vkRollupRecord = ZkCompile.verificationKeyToDBRecord(
      EContractName.Rollup,
      merkleHeight,
      zkDbProcessor.vkRollup
    );

    const vkList = (
      await imVerification
        .find({
          merkleHeight,
          verificationKeyHash: {
            $in: [
              vkContractRecord.verificationKeyHash,
              vkRollupRecord.verificationKeyHash,
            ],
          },
        })

        .toArray()
    ).map((e) => e.verificationKeyHash);

    const insertVkList = [vkContractRecord, vkRollupRecord].filter(
      (e) => !vkList.includes(e.verificationKeyHash)
    );

    if (insertVkList.length > 0) {
      // Insert these 2 vk contract & rollup to database
      const vkInsertResult = await imVerification.insertMany(insertVkList, {
        session,
      });
      return vkInsertResult.acknowledged;
    }

    return true;
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

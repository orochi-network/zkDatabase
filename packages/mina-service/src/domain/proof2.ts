import { CircuitFactory } from '@circuit';
import { logger } from '@helper';
import { databaseName, EProofStatusDocument, TQueueRecord } from '@zkdb/common';
import { getZkDbSmartContractClass } from '@zkdb/smart-contract';
import {
  ModelMerkleTree,
  ModelMetadataDatabase,
  ModelProof,
  TCompoundSession,
} from '@zkdb/storage';
import { fetchAccount, Field, MerkleWitness, PublicKey, ZkProgram } from 'o1js';

class Proof {
  static async create(
    {
      databaseName,
      collectionName,
      createdAt,
      merkleIndex,
      status,
      hash,
      _id,
    }: TQueueRecord,
    session: TCompoundSession
  ) {
    // Ensure status must be 'queued' to process
    if (status !== EProofStatusDocument.Queued) {
      throw new Error(
        `Task status should be in ${EProofStatusDocument.Queued}`
      );
    }
    // Initialize metadata database model to get merkle height and appPublicKey
    // to detect on-chain/off-chain proof
    const imMetadataDatabase = ModelMetadataDatabase.getInstance();

    const metadataDatabase = await imMetadataDatabase.findOne({ databaseName });

    if (!metadataDatabase) {
      throw new Error(`Metadata database ${databaseName} cannot be found`);
    }

    const { merkleHeight, appPublicKey } = metadataDatabase;

    if (merkleHeight < 8 || merkleHeight > 256) {
      throw new Error(
        `Invalid Merkle height. Expected 8-256, got ${merkleHeight}`
      );
    }

    const circuitName = `${databaseName}.${collectionName}`;
    // On-chain proof
    if (appPublicKey) {
    }
  }

  /**/
  private async createOnChainProof({
    appPublicKey,
    databaseName,
    circuitName,
    merkleHeight,
  }: {
    appPublicKey: string;
    databaseName: string;
    circuitName: string;
    merkleHeight: number;
  }) {
    // Convert base58 string to PublicKey o1js type
    const databasePublicKey = PublicKey.fromBase58(appPublicKey);

    const { account, error } = await fetchAccount({
      publicKey: databasePublicKey,
    });

    // Ensure account existed and don't have any error
    if (!account || error) {
      // Right now `fetchAccount` from o1js doesn't return a flag
      // to recognize it a `zkApp` address or normal address

      // It can be a case that error is undefined,
      // it still be an error exception and escape the function
      // But we also need log.error to prevent it undefined and we can't get the log
      logger.error(
        `This zkApp publicKey ${appPublicKey} cannot be found in Mina blockchain`
      );

      throw error;
    }

    // Check Circuit existed
    if (!CircuitFactory.contains(circuitName)) {
      // Create & compile Circuit if does not have
      await CircuitFactory.createCircuit(circuitName, merkleHeight);
    }

    const circuit = CircuitFactory.getCircuit(circuitName).getProgram();
    class RollUpProof extends ZkProgram.Proof(circuit) {}
    class DatabaseMerkleWitness extends MerkleWitness(merkleHeight) {}

    class ZkDbApp extends getZkDbSmartContractClass(merkleHeight, circuit) {}
    const zkDbApp = new ZkDbApp(databasePublicKey);

    const onChainRootState: Field = zkDbApp.currentState.get();
    const prevOnChainRootState: Field = zkDbApp.prevState.get();

    // Find merkleWitness
    const imMerkleTree = await ModelMerkleTree.getInstance(databaseName);
  }
}

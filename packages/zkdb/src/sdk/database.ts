import {
  AccountUpdate,
  Field,
  JsonProof,
  Mina,
  PrivateKey,
  PublicKey,
} from 'o1js';
import { ZKDatabase } from './interfaces/database.js';
import { getZkDbSmartContract, RollUpProgram } from '@zkdb/smart-contract';
import {
  collectionExist,
  createCollection,
  createDatabase,
  getDatabaseSettings,
  listGroups,
  getMerkleRoot,
  getProof,
} from '@zkdb/api';
import { DatabaseInfo } from './types/database.js';
import { Group } from './group.js';
import { ZKGroup } from './interfaces/group.js';
import { createGroup } from '@zkdb/api';
import { ZKCollection } from './interfaces/collection.js';
import { ZKCollectionImpl } from './collection.js';
import { DocumentEncoded, SchemaDefinition } from '../core/schema.js';
import { Permissions } from '../types/permission.js';
import { AuroWallet } from './wallet/auro-wallet.js';

const transactionFee = 0.1;
export class ZKDatabaseImpl implements ZKDatabase {
  private databaseName: string;
  private merkleHeight: number;
  private appPublicKey: string;

  constructor(
    databaseName: string,
    merkleHeight: number,
    appPublicKey: string
  ) {
    this.databaseName = databaseName;
    this.merkleHeight = merkleHeight;
    this.appPublicKey = appPublicKey;
  }

  static async createWithSignedTx(
    databaseName: string,
    merkleHeight: number,
    transaction: {
      senderAddress: PublicKey;
      fee: number;
      memo: string;
    },
    zkAppPrivateKey?: PrivateKey | undefined
  ): Promise<void> {
    // TODO: Check if it is browser env
    // class ZkDatabaseAppClass extends (await getZkDbSmartContract(
    //   databaseName,
    //   merkleHeight
    // )) {}
    // // TODO: Request compilation cache from service by merkle height
    // // send compilation callback
    // await ZkDatabaseAppClass.compile();
    // const privateKey = zkAppPrivateKey ?? PrivateKey.random();
    // const publicKey = privateKey.toPublicKey();
    // const zkDatabaseAppInstance = new ZkDatabaseAppClass(publicKey);
    // const tx = await Mina.transaction(async () => {
    //   AccountUpdate.fundNewAccount(transaction.senderAddress);
    //   await zkDatabaseAppInstance.deploy();
    // });
    //  // send compilation prove
    // await tx.prove();
    // const txn = tx.sign([privateKey]);
    //  // send compilation prove
    // const { hash, signedData } = await (window as any).mina.sendTransaction({
    //   transaction: txn.toJSON(),
    //   feePayer: {
    //     fee: transaction.fee,
    //     memo: transaction.memo,
    //   },
    // });
    // let pendingTransaction = await txn.send();
    // if (pendingTransaction.status === 'pending') {
    //   // Transaction accepted for processing by the Mina daemon
    //   // eslint-disable-next-line no-useless-catch
    //   try {
    //     await pendingTransaction.wait();
    //     // Transaction successfully included in a block
    //   } catch (error) {
    //     // Transaction was rejected or failed to be included in a block
    //     throw Error(
    //       'Transaction was rejected or failed to be included in a block: ',
    //       error as any
    //     );
    //   }
    // } else {
    //   throw Error(
    //     'Transaction was not accepted for processing by the Mina daemon'
    //   );
    // }
    // const result = await createDatabase(
    //   databaseName,
    //   merkleHeight,
    //   publicKey.toBase58()
    // );
    // if (result.type === 'success') {
    //   return;
    // }
    // throw Error(result.message);
  }

  static async create(
    databaseName: string,
    merkleHeight: number,
    senderKey: PrivateKey
  ): Promise<void> {
    // TODO: Check if it is node js env
    class ZkDatabaseAppClass extends getZkDbSmartContract(
      databaseName,
      merkleHeight
    ) {}

    await ZkDatabaseAppClass.compileProof();

    const zkAppPrivateKey = PrivateKey.random();

    const zkApp = new ZkDatabaseAppClass(
      PublicKey.fromPrivateKey(zkAppPrivateKey)
    );

    await zkApp.createAndProveDeployTransaction(senderKey, zkAppPrivateKey);

    const result = await createDatabase(
      databaseName,
      merkleHeight,
      PublicKey.fromPrivateKey(zkAppPrivateKey).toBase58()
    );

    if (result.type === 'success') {
      return;
    }

    throw Error(result.message);
  }

  static async getDatabaseSettings(
    databaseName: string
  ): Promise<DatabaseInfo | null> {
    const result = await getDatabaseSettings(databaseName);

    if (result.type === 'success') {
      return result.data;
    } else {
      return null;
    }
  }

  async createGroup(name: string, description: string): Promise<ZKGroup> {
    const result = await createGroup(this.databaseName, name, description);

    if (result.type === 'success') {
      return new Group(this.databaseName, name);
    } else {
      throw Error(result.message);
    }
  }

  group(name: string): ZKGroup {
    return new Group(this.databaseName, name);
  }

  async listGroups(): Promise<ZKGroup[]> {
    const result = await listGroups(this.databaseName);

    if (result.type === 'success') {
      return result.data.map(
        (groupName) => new Group(this.databaseName, groupName)
      );
    } else {
      throw Error(result.message);
    }
  }

  async createCollection(
    collectionName: string,
    groupName: string,
    schemaDefinition: SchemaDefinition,
    permissions: Permissions
  ): Promise<void> {
    const result = await createCollection(
      this.databaseName,
      collectionName,
      groupName,
      schemaDefinition,
      permissions
    );

    if (result.type === 'success') {
      return;
    } else {
      throw Error(result.message);
    }
  }

  async collection<
    T extends {
      new (..._args: any[]): InstanceType<T>;
      deserialize: (_doc: DocumentEncoded) => any;
    },
  >(collectionName: string, schema: T): Promise<ZKCollection<T>> {
    const collectionExist = await this.collectionExist(collectionName);

    if (collectionExist) {
      return ZKCollectionImpl.loadCollection(
        this.databaseName,
        collectionName,
        schema
      );
    } else {
      throw Error(`Collection ${collectionName} does not exist`);
    }
  }

  async collectionExist(collectionName: string): Promise<boolean> {
    const result = await collectionExist(this.databaseName, collectionName);

    if (result.type === 'success') {
      return result.data;
    } else {
      throw Error(result.message);
    }
  }

  async getRoot(): Promise<Field> {
    const result = await getMerkleRoot(this.databaseName);

    if (result.type === 'success') {
      return Field(result.data);
    } else {
      throw Error(result.message);
    }
  }

  async rollUp(senderPrivateKey: PrivateKey): Promise<void> {
    class ZkDatabaseAppClass extends getZkDbSmartContract(
      this.databaseName,
      this.merkleHeight
    ) {}

    await ZkDatabaseAppClass.compileProof();

    const proof = await this.getProof();

    const zkApp = new ZkDatabaseAppClass(
      PublicKey.fromBase58(this.appPublicKey)
    );

    const tx = await zkApp.createAndProveRollUpTransaction(
      proof,
      PublicKey.fromPrivateKey(senderPrivateKey)
    );

    await AuroWallet.signAndSendTransaction(tx);
  }

  async getProof(): Promise<JsonProof> {
    const result = await getProof(this.databaseName);

    if (result.type === 'success') {
      return result.data;
    } else {
      throw Error(result.message);
    }
  }
}

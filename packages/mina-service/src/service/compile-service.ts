import { QueueWorker } from '@helper';
import { TTransactionQueue } from '@zkdb/common';
import { ZKDB_TRANSACTION_QUEUE } from '@zkdb/storage';
import { ZkCompile } from '@domain';
import { NetworkId } from 'o1js';

type CompileServiceConfig = {
  network: {
    networkId: NetworkId;
    rpc: string;
  };
};

class CompileService {
  private queue: QueueWorker<TTransactionQueue>;
  private zkCompiler: any;
  constructor(private readonly config: CompileServiceConfig) {
    const { network } = config;

    this.queue = new QueueWorker<TTransactionQueue>(ZKDB_TRANSACTION_QUEUE);
    this.zkCompiler = new ZkCompile({
      networkId: network.networkId,
      mina: network.rpc,
    });
  }

  public start() {}
}

class Test {
  constructor(private readonly user: { name: string }) {
    const { name } = this.user;
    console.log(name);
  }
}

const t = new Test({ name: 'Sang' });

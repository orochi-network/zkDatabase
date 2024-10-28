import { logger } from "@helper";
import { ZKDatabaseSmartContractWrapper } from "@zkdb/smart-contract";
import { fetchAccount, Mina, PrivateKey, PublicKey } from "o1js";
import { DbDeployQueue } from "..";

export class ZkCompileService {
  constructor(
    private readonly network: { networkId: "testnet" | "mainnet"; mina: string }
  ) {}
  async compileAndCreateUnsignTx(req: DbDeployQueue) {
    // Set active network
    const network = Mina.Network(this.network);
    console.log(
      "🚀 ~ ZkCompileService ~ compileAndCreateUnsignTx ~ this.network:",
      this.network
    );
    Mina.setActiveInstance(network);
    // Checking the payer balance
    // const payerAccount = await fetchAccount({
    //   publicKey: PublicKey.fromBase58(req.payerAddress),
    // });
    // console.log(payerAccount.account?.balance);
    // if (payerAccount.account?.balance.lessThan(UInt64.from(1))) {
    //   throw new Error("Insufficient funds, need at least 1.1 Mina to deploy");
    // }
    // Create keypair for zkApp contract
    const zkDbPrivateKey = PrivateKey.random();
    const zkDbPublicKey = PublicKey.fromPrivateKey(zkDbPrivateKey);
    // Init zk wrapper
    const zkWrapper = new ZKDatabaseSmartContractWrapper(
      req.merkleHeight,
      zkDbPublicKey
    );
    const start = performance.now();
    // Compile
    await zkWrapper.compile();
    // Create unsigned transaction
    let unsignedTx = await zkWrapper.createAndProveDeployTransaction(
      PublicKey.fromBase58(req.payerAddress)
    );
    unsignedTx = unsignedTx.sign([zkDbPrivateKey]);
    const end = performance.now();
    logger.info(
      `Compile and deploy ${zkDbPublicKey.toBase58()} take ${(end - start) / 1000}s`
    );

    return {
      tx: unsignedTx.toJSON(),
      zkAppAddress: zkDbPublicKey.toBase58(),
      merkleHeight: req.merkleHeight,
    };
  }
}

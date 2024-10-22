import { ZKDatabaseSmartContractWrapper } from "@zkdb/smart-contract";
import { Mina, PrivateKey, PublicKey } from "o1js";

export type TDeploymentRequest = {
  payerAddress: string;
  merkleHeight: number;
};

export class ZkCompileService {
  constructor(
    private readonly network: { networkId: "testnet" | "mainnet"; mina: string }
  ) {}
  async compileAndCreateUnsignTx(request: string) {
    let req = JSON.parse(request);
    // Set active network
    const network = Mina.Network(this.network);
    Mina.setActiveInstance(network);
    // Create keypair for zkApp contract

    const zkDbPrivateKey = PrivateKey.random();
    const zkDbPublicKey = PublicKey.fromPrivateKey(zkDbPrivateKey);
    // Init zk wrapper
    const zkWrapper = new ZKDatabaseSmartContractWrapper(
      req.merkleHeight,
      zkDbPublicKey
    );
    console.log(
      "🚀 ~ ZkCompileService ~ compileAndCreateUnsignTx ~ zkWrapper:",
      zkWrapper
    );
    // Compile
    await zkWrapper.compile();
    // Create unsigned transaction
    let unsignedTx = await zkWrapper.createAndProveDeployTransaction(
      PublicKey.fromBase58(req.payerAddress)
    );
    unsignedTx = unsignedTx.sign([zkDbPrivateKey]);
    return {
      tx: unsignedTx,
      zkAppAddress: zkDbPublicKey,
    };
  }
}

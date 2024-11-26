import { NetworkId } from "o1js"

export type TEnvironment = {
  networkId: NetworkId
}

export class Environment {
  private static instance: Environment;
  #environment: TEnvironment;

  public static getInstance() {
    if (!Environment.instance) {
      Environment.instance = new Environment();
    }

    return Environment.instance
  }

  setEnv(environment: TEnvironment) {
    this.#environment = environment;
  }

  getEnv() {
    return this.#environment;
  }
}
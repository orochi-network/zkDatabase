import { logger } from '@helper';
import { RollupProxy, getDatabaseRollupFunction } from './rollup-program';

export class CircuitFactory {
  private static instance = new Map<string, RollupProxy>();

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  private constructor() {}

  static getCircuit(name: string): RollupProxy {
    try {
      return this.instance.get(name)!;
    } catch (e) {
      logger.error(e);
      throw Error(`Circuit with the name ${name} does not exist`);
    }
  }

  static async createCircuit(
    name: string,
    merkleHeight: number
  ): Promise<RollupProxy> {
    if (this.instance.has(name)) {
      return this.instance.get(name)!;
    }

    const newCircuit = getDatabaseRollupFunction(merkleHeight);
    await newCircuit.compile();

    this.instance.set(name, newCircuit);

    return newCircuit;
  }

  static contains(name: string): boolean {
    return this.instance.has(name);
  }
}

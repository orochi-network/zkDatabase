import logger from '../helper/logger';
import { RollUpProxy, getDatabaseRollUpFunction } from './rollup-program';

export default class CircuitFactory {
  private static instance = new Map<string, RollUpProxy>();

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  private constructor() {}
  
  static getCircuit(name: string): RollUpProxy {
    try {
      return this.instance.get(name)!;
    } catch (e) {
      logger.error(e);
      throw Error(`Circuit with the name ${name} does not exist`);
    }
  }

  static async createCircuit(name: string, merkleHeight: number): Promise<RollUpProxy> {
    if (this.instance.has(name)) {
      return this.instance.get(name)!;
    }

    const newCircuit = getDatabaseRollUpFunction(name, merkleHeight);
    await newCircuit.compile();
    
    this.instance.set(name, newCircuit);

    return newCircuit;
  }

  static contains(name: string): boolean {
    return this.instance.has(name);
  }
}

import { Cache } from 'o1js';

export class CircuitCache {
  getCache(name: string): Cache {
    return Cache.FileSystem(`./circuit-cache/${name}`);
  }
}

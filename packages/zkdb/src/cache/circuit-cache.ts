import { Cache } from "o1js";

// We should keep cache in a remote storage to optimize circuit generate time
export class CircuitCache {

  getCache(name: string): Cache {
    return Cache.FileSystem(`./${name}`)
  }
}
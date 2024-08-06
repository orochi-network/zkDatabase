import { BrowserStorage } from "./browser.js";
import { IStorage } from "./interface/storage.js";
import { NodeStorage } from "./node.js";

let storage: IStorage;

if (typeof window !== 'undefined' && typeof window.localStorage !== 'undefined') {
  storage = new BrowserStorage();
} else if (typeof process !== 'undefined' && process.versions != null && process.versions.node != null) {
  storage = new NodeStorage();
} else {
  throw new Error('Unsupported environment');
}

export default storage;
export class InMemoryStorage implements Storage {
  [name: string]: any;
  keys: string[] = [];
  length: number;

  clear(): void {
    for (const key of this.keys) {
      delete this[key];
    }
  }

  getItem(key: string): string | null {
    return this[key] || null;
  }

  key(index: number): string | null {
    return this.keys[index] || null;
  }

  removeItem(key: string): void {
    this.keys = this.keys.filter((k) => k !== key);
    delete this[key];
  }

  setItem(key: string, value: string): void {
    if (!this[key]) {
      this.keys.push(key);
    }
    this[key] = value;
  }
}

export default InMemoryStorage;

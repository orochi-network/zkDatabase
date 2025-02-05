// eslint-disable-next-line no-undef
export class InMemoryStorage implements Storage {
  [name: string]: any;

  private keys: string[] = [];

  get length(): number {
    return this.keys.length;
  }

  clear(): void {
    for (let i = 0; i < this.keys.length; i += 1) {
      delete this[this.keys[i]];
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
